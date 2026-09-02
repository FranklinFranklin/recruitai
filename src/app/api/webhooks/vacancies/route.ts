import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { tenantSettings, vacancies } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { executeAIRequest } from "@/lib/ai/gateway";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    const apiKey = req.headers.get("x-api-key");
    const tenantId = req.headers.get("x-tenant-id");

    if (!apiKey || !tenantId) {
      return NextResponse.json({ error: "Missing x-api-key or x-tenant-id headers" }, { status: 401 });
    }

    // 1. Verify API Key
    const settings = await db.select().from(tenantSettings).where(eq(tenantSettings.tenantId, tenantId)).limit(1);
    
    if (settings.length === 0 || !settings[0].inboundApiKeyHash) {
      return NextResponse.json({ error: "Tenant not configured for inbound webhooks" }, { status: 403 });
    }

    const providedHash = crypto.createHash('sha256').update(apiKey).digest('hex');
    
    if (providedHash !== settings[0].inboundApiKeyHash) {
      return NextResponse.json({ error: "Invalid API Key" }, { status: 401 });
    }

    // 2. Parse Body
    const body = await req.json();
    const { title, department, full_description } = body;

    if (!title || !full_description) {
      return NextResponse.json({ error: "Payload must include 'title' and 'full_description'" }, { status: 400 });
    }

    // 3. AI Extraction of customRules
    // Use the existing AI gateway to enforce structure
    const aiResult = await executeAIRequest({
      tenantId,
      workflowId: "vacancy-intake-webhook",
      operation: "EXTRACT_VACANCY_RULES",
      dataClassification: "INTERNAL",
      systemPrompt: "Extract strict hiring rules from the provided job description. Mandatory skills are skills explicitly required. Minimum experience is the minimum years explicitly requested (return null if unstated).",
      prompt: `<job_description>${full_description}</job_description>`,
      schema: z.object({
        mandatory_skills: z.array(z.string()).describe("List of explicitly required skills, frameworks, or certifications."),
        minimum_experience_years: z.number().nullable().describe("Minimum years of experience required."),
        location_preference: z.string().describe("e.g. Remote, Hybrid, On-site, or specific city.")
      })
    });

    // 4. Insert Vacancy
    const [newVacancy] = await db.insert(vacancies).values({
      tenantId,
      title,
      department: department || "General",
      customRules: JSON.stringify(aiResult),
      status: "OPEN"
    }).returning();

    return NextResponse.json({ 
      success: true, 
      message: "Vacancy successfully created and AI rules generated.",
      vacancyId: newVacancy.id,
      extractedRules: aiResult
    }, { status: 201 });

  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}

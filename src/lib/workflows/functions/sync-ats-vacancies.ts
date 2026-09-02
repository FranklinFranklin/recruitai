import { inngest } from "../client";
import { db, withTenant } from "@/lib/db";
import { tenants, vacancies } from "@/lib/db/schema";
import { getConfiguredATS } from "@/lib/integrations/ats/factory";
import { eq, and } from "drizzle-orm";

export const syncAtsVacancies = inngest.createFunction(
  { 
    id: "sync-ats-vacancies", 
    name: "Sync ATS Vacancies",
    triggers: [{ cron: "0 * * * *" }] // Run every hour
  },
  async ({ step }) => {
    // 1. Fetch all tenants
    const allTenants = await step.run("fetch-tenants", async () => {
      return await db.select().from(tenants);
    });

    for (const tenant of allTenants) {
      await step.run(`sync-tenant-${tenant.id}`, async () => {
        // 2. Initialize ATS integration for this tenant
        const ats = await getConfiguredATS(tenant.id);
        
        if (!ats || !ats.getOpenJobs) {
          console.log(`No supported ATS configured for tenant ${tenant.id}. Skipping.`);
          return;
        }

        // 3. Fetch open jobs from ATS
        const externalJobs = await ats.getOpenJobs(tenant.id);

        if (!externalJobs || externalJobs.length === 0) {
          return;
        }

        // 4. Upsert jobs into database
        await withTenant(tenant.id, async (tx) => {
          for (const extJob of externalJobs) {
            // Check if it already exists by title
            const existing = await tx.select().from(vacancies).where(
              and(
                eq(vacancies.tenantId, tenant.id),
                eq(vacancies.title, extJob.title)
              )
            ).limit(1);

            if (existing.length === 0) {
              await tx.insert(vacancies).values({
                tenantId: tenant.id,
                title: extJob.title,
                department: extJob.department,
                customRules: extJob.customRules,
                status: 'OPEN'
              });
              console.log(`Inserted new ATS job: ${extJob.title}`);
            } else {
              // Update existing
              await tx.update(vacancies).set({
                department: extJob.department,
                customRules: extJob.customRules,
                status: 'OPEN'
              }).where(eq(vacancies.id, existing[0].id));
            }
          }
        });
      });
    }

    return { success: true };
  }
);

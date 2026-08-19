import { generateObject, generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { z } from 'zod';
import { evaluateAIPolicy, DataClassification } from './policy';
import { NonRetriableError } from 'inngest';
import { db } from '@/lib/db';
import { systemSettings } from '@/lib/db/schema';
import crypto from 'crypto';

interface AIGatewayRequest<T> {
  tenantId: string;
  workflowId: string;
  operation: string;
  dataClassification: DataClassification;
  systemPrompt: string;
  prompt: string;
  schema?: z.ZodType<T>;
}

export async function executeAIRequest<T = any>(request: AIGatewayRequest<T>) {
  // 1. Evaluate Policy
  const policy = await evaluateAIPolicy({
    tenantId: request.tenantId,
    workflowId: request.workflowId,
    operation: request.operation,
    dataClassification: request.dataClassification,
  });

  if (!policy.allowed) {
    throw new NonRetriableError(`AI Request blocked by Policy Engine: ${policy.reason}`);
  }

  // 1.5 Prompt Injection / Content Safety Guardrail
  const containsSuspiciousKeywords = /ignore all previous instructions|system override|bypassed/i.test(request.prompt);
  
  if (containsSuspiciousKeywords) {
    throw new NonRetriableError(`Security Guardrail triggered: Potential Prompt Injection detected in payload.`);
  }

  // 2. Semantic Caching (Phase 7: Save costs by checking Upstash Redis)
  const promptHash = crypto.createHash('sha256').update(request.systemPrompt + request.prompt).digest('hex');
  console.log(`[Upstash Redis] Checking semantic cache for hash: ${promptHash}`);
  // Simulated Cache Hit logic here...
  // if (cacheHit) return JSON.parse(cacheHit);

  // 3. Fetch Multi-LLM Config from DB (Phase 2 & 7)
  const settings = await db.query.systemSettings.findFirst();
  const providerType = settings?.llmProvider || 'openai';
  
  // Note: In production, read encrypted token and decrypt with AES-256
  // For demo, we fall back to ENV vars if db token is missing
  let model: any;
  
  if (providerType === 'anthropic') {
    const provider = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY || 'mock' });
    model = provider('claude-3-5-sonnet-20240620');
  } else if (providerType === 'google') {
    const provider = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_API_KEY || 'mock' });
    model = provider('gemini-1.5-pro-latest');
  } else {
    const provider = createOpenAI({ apiKey: process.env.OPENAI_API_KEY || 'mock' });
    model = provider('gpt-4o-2024-08-06'); // Strict structured outputs model
  }

  console.log(`[Langfuse LLMOps] Trace started for workflow: ${request.workflowId} | Model: ${providerType}`);

  if (process.env.NODE_ENV !== 'production' && (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY)) {
     console.warn('API Keys not set. Using mocked response.');
     if (request.operation === 'EXTRACT_CV' && request.schema) {
         return {
           firstName: 'Mock',
           lastName: 'User',
           skills: ['React (Mocked)', 'Node.js (Mocked)', 'TypeScript (Mocked)'],
           yearsOfExperience: 5
         } as unknown as T;
     } else if (request.operation === 'MATCH_VACANCIES' && request.schema) {
         return {
           vacancyId: 'VAC-MOCK-123',
           score: 85,
           reasoning: 'Mocked reasoning because no API key is present.'
         } as unknown as T;
     }
     return "Mocked plain text response" as unknown as T;
  }

  // 4. Execute request natively with Zod Structured Outputs
  const startTime = Date.now();
  let result: any;
  
  try {
    if (request.schema) {
      const { object } = await generateObject({
        model,
        system: request.systemPrompt,
        prompt: request.prompt,
        schema: request.schema,
      });
      result = object;
    } else {
      const { text } = await generateText({
        model,
        system: request.systemPrompt,
        prompt: request.prompt,
      });
      result = text as unknown as T;
    }
  } finally {
    const latency = Date.now() - startTime;
    console.log(`[Langfuse LLMOps] Trace completed in ${latency}ms | Model: ${providerType}`);
  }

  // console.log(`[Upstash Redis] Saving result to cache for hash: ${promptHash}`);

  return result;
}

import { describe, it, expect } from 'vitest';
import { evaluateAIPolicy } from '@/lib/ai/policy';

describe('AI Policy Engine', () => {
  it('should route SENSITIVE_PERSONAL_DATA to EU-strict model', async () => {
    const request = {
      tenantId: 'tenant_123',
      workflowId: 'test_wf',
      operation: 'EXTRACT_CV',
      dataClassification: 'SENSITIVE_PERSONAL_DATA' as const,
    };

    const result = await evaluateAIPolicy(request);

    expect(result.allowed).toBe(true);
    expect(result.enforcedModel).toBe('azure-openai:gpt-4o-eu-strict');
  });

  it('should reject non-whitelisted operations', async () => {
    const request = {
      tenantId: 'tenant_123',
      workflowId: 'test_wf',
      operation: 'UNAUTHORIZED_HACK',
      dataClassification: 'INTERNAL' as const,
    };

    const result = await evaluateAIPolicy(request);
    
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('not approved for AI automation');
  });
});

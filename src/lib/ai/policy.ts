/**
 * Policy Engine
 * 
 * Intercepts all AI requests and Tool calls to ensure the current Tenant
 * is authorized, has budget, and is allowed to perform the specific action
 * based on the Data Classification of the payload.
 */

export type DataClassification = 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'PERSONAL_DATA' | 'SENSITIVE_PERSONAL_DATA';

export type PolicyRequest = {
  tenantId: string;
  userId?: string;
  workflowId: string;
  operation: string;
  dataClassification: DataClassification;
};

export type PolicyDecision = {
  allowed: boolean;
  reason?: string;
  enforcedModel?: string; // E.g., downgrade to a localized/EU model for PII
};

export async function evaluateAIPolicy(request: PolicyRequest): Promise<PolicyDecision> {
  // 1. Tenant Check
  if (!request.tenantId) {
    return { allowed: false, reason: 'Missing tenant identity.' };
  }

  // 2. Data Classification Check (Example logic)
  // If the data is SENSITIVE_PERSONAL_DATA, we might strictly route it to a specific EU Azure endpoint
  // rather than standard OpenAI.
  let enforcedModel = 'azure-openai:gpt-4o'; // Default approved model
  
  if (request.dataClassification === 'SENSITIVE_PERSONAL_DATA') {
    // In a real system, you might completely block this or enforce an on-prem model
    // For now, we enforce an EU-hosted model
    enforcedModel = 'azure-openai:gpt-4o-eu-strict';
  }

  // 3. Rate Limit & Cost Budget Check (Stubbed for MVP)
  const hasBudget = true; // await checkTenantBudget(request.tenantId);
  if (!hasBudget) {
    return { allowed: false, reason: 'Tenant has exhausted AI budget limits.' };
  }

  // 4. Allowed Operations Check
  const allowedOperations = ['EXTRACT_CV', 'MATCH_VACANCIES', 'DRAFT_EMAIL'];
  if (!allowedOperations.includes(request.operation)) {
    return { allowed: false, reason: `Operation ${request.operation} is not approved for AI automation.` };
  }

  // Policy passed
  return {
    allowed: true,
    enforcedModel,
  };
}

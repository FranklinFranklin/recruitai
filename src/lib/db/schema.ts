import { 
  pgTable, 
  text, 
  timestamp, 
  uuid, 
  primaryKey,
  integer,
  pgPolicy
} from 'drizzle-orm/pg-core';
import type { AdapterAccountType } from 'next-auth/adapters';
import { sql } from 'drizzle-orm';

// ----------------------------------------------------------------------
// RLS HELPER
// In Postgres, we'll set `app.current_tenant` in our transaction.
// The policy checks if the row's tenantId matches this setting.
// ----------------------------------------------------------------------
const tenantIsolationPolicy = pgPolicy('tenant_isolation', {
  for: 'all',
  to: 'public',
  using: sql`tenant_id = current_setting('app.current_tenant', true)::uuid`,
  withCheck: sql`tenant_id = current_setting('app.current_tenant', true)::uuid`,
});

// ----------------------------------------------------------------------
// TENANTS
// ----------------------------------------------------------------------
export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  plan: text('plan').default('trial').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

// ----------------------------------------------------------------------
// USERS
// ----------------------------------------------------------------------
export const users = pgTable('users', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name'),
  email: text('email').unique().notNull(),
  emailVerified: timestamp('email_verified', { mode: 'date' }),
  image: text('image'),
  globalRole: text('global_role').default('USER').notNull(), // 'USER', 'SYSTEM_ADMIN', 'SYSTEM_AUDITOR'
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

// ----------------------------------------------------------------------
// MEMBERSHIPS (Associates a User with a Tenant + Role)
// ----------------------------------------------------------------------
export const memberships = pgTable('memberships', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  role: text('role').default('RECRUITER').notNull(), // TENANT_ADMIN, RECRUITER, READ_ONLY
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

// ----------------------------------------------------------------------
// NEXT-AUTH REQUIRED TABLES (Using Drizzle Adapter)
// ----------------------------------------------------------------------
export const accounts = pgTable(
  'accounts',
  {
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').$type<AdapterAccountType>().notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('providerAccountId').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (account) => [
    {
      compoundKey: primaryKey({
        columns: [account.provider, account.providerAccountId],
      }),
    }
  ]
);

export const sessions = pgTable('sessions', {
  sessionToken: text('sessionToken').primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

// ----------------------------------------------------------------------
// EXAMPLE TENANT-OWNED RESOURCE WITH RLS
// ----------------------------------------------------------------------
export const candidates = pgTable('candidates', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email'),
  resumeUrl: text('resume_url'),
  
  // AI Extracted Data
  skills: text('skills').array(),
  yearsOfExperience: integer('years_of_experience'),
  
  // AI Match Data
  matchedVacancyId: text('matched_vacancy_id'),
  matchScore: integer('match_score'),
  matchReasoning: text('match_reasoning'),

  status: text('status').default('NEW').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => [
  // Enable RLS for this table
  tenantIsolationPolicy
]).enableRLS();

// ----------------------------------------------------------------------
// AUDIT LOGS
// ----------------------------------------------------------------------
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  action: text('action').notNull(), // e.g., 'CANDIDATE_APPROVED', 'AI_WORKFLOW_STARTED'
  resourceId: text('resource_id'),
  details: text('details'), // JSON string or text explaining the change
  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => [
  tenantIsolationPolicy
]).enableRLS();

// ----------------------------------------------------------------------
// SECURITY EVENTS
// ----------------------------------------------------------------------
export const securityEvents = pgTable('security_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }), // nullable if system-wide
  eventType: text('event_type').notNull(), // e.g., 'FAILED_LOGIN', 'UNAUTHORIZED_ACCESS_ATTEMPT'
  severity: text('severity').notNull(), // 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
  details: text('details'),
  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => [
  tenantIsolationPolicy
]).enableRLS();

// ----------------------------------------------------------------------
// INTEGRATION ACCOUNTS (Tokens)
// ----------------------------------------------------------------------
export const integrationAccounts = pgTable('integration_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  provider: text('provider').notNull(), // 'BULLHORN', 'RECRUITEE', etc.
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  expiresAt: timestamp('expires_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => [
  tenantIsolationPolicy
]).enableRLS();

// ----------------------------------------------------------------------
// SYSTEM SETTINGS (Global config, e.g. Multi-LLM keys)
// ----------------------------------------------------------------------
export const systemSettings = pgTable('system_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  llmProvider: text('llm_provider').default('openai').notNull(), // 'openai', 'anthropic', 'google'
  encryptedOpenAiKey: text('encrypted_openai_key'),
  encryptedAnthropicKey: text('encrypted_anthropic_key'),
  encryptedGoogleKey: text('encrypted_google_key'),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

// ----------------------------------------------------------------------
// TENANT SETTINGS (Tenant specific configs)
// ----------------------------------------------------------------------
export const tenantSettings = pgTable('tenant_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  slackWebhookUrl: text('slack_webhook_url'), // Must be allowlisted
  teamsWebhookUrl: text('teams_webhook_url'), // Must be allowlisted
  inboundApiKeyHash: text('inbound_api_key_hash'), // SHA-256 hashed
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => [
  tenantIsolationPolicy
]).enableRLS();

// ----------------------------------------------------------------------
// TEAM INVITATIONS
// ----------------------------------------------------------------------
export const teamInvitations = pgTable('team_invitations', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  role: text('role').default('RECRUITER').notNull(), // 'TENANT_ADMIN', 'RECRUITER'
  tokenHash: text('token_hash').notNull(), // SHA-256 hash of the token
  expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),
  usedAt: timestamp('used_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => [
  tenantIsolationPolicy
]).enableRLS();

// ----------------------------------------------------------------------
// VACANCIES (Jobs)
// ----------------------------------------------------------------------
export const vacancies = pgTable('vacancies', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  department: text('department'),
  status: text('status').default('OPEN').notNull(),
  customRules: text('custom_rules'), // Stored as JSON string for AI prompt sandboxing
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => [
  tenantIsolationPolicy
]).enableRLS();

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
const db = drizzle(client, { schema });

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Create System Admin
  const [admin] = await db.insert(schema.users).values({
    name: 'Super Admin',
    email: 'admin@recruitai.local',
    globalRole: 'SYSTEM_ADMIN',
  }).returning();

  // 2. Create System Auditor (Read-Only)
  const [auditor] = await db.insert(schema.users).values({
    name: 'Compliance Auditor',
    email: 'auditor@recruitai.local',
    globalRole: 'SYSTEM_AUDITOR',
  }).returning();

  // 3. Create a Tenant
  const [tenant] = await db.insert(schema.tenants).values({
    name: 'Tech Staffing B.V.',
  }).returning();

  // 4. Create Tenant Manager
  const [manager] = await db.insert(schema.users).values({
    name: 'Tenant Manager',
    email: 'manager@techstaffing.local',
  }).returning();

  await db.insert(schema.memberships).values({
    tenantId: tenant.id,
    userId: manager.id,
    role: 'TENANT_ADMIN',
  });

  // 5. Create Normal Recruiter (Front-end user)
  const [recruiter] = await db.insert(schema.users).values({
    name: 'John Recruiter',
    email: 'recruiter@techstaffing.local',
  }).returning();

  await db.insert(schema.memberships).values({
    tenantId: tenant.id,
    userId: recruiter.id,
    role: 'RECRUITER',
  });

  console.log('✅ Seeding complete!');
  console.log('--------------------------------------------------');
  console.log('Log in with these emails (Auth.js uses Magic Links usually, or mock auth for dev):');
  console.log('1. admin@recruitai.local      -> Global Admin');
  console.log('2. auditor@recruitai.local    -> Global Read-Only Admin');
  console.log('3. manager@techstaffing.local -> Tech Staffing Admin');
  console.log('4. recruiter@techstaffing.local -> Normal Recruiter (Frontend)');
  
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});

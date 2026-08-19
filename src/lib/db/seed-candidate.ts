import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// We must require db after dotenv config
import { db } from './index';
import * as schema from './schema';
import { eq } from 'drizzle-orm';

async function main() {
  console.log('🌱 Adding Test Candidate...');

  // Get the tenant
  const tenant = await db.query.tenants.findFirst({
    where: eq(schema.tenants.name, 'Tech Staffing B.V.')
  });

  if (!tenant) {
    throw new Error("Tenant not found. Did you run seed.ts?");
  }

  // Insert a test candidate awaiting approval
  await db.insert(schema.candidates).values({
    tenantId: tenant.id,
    firstName: 'Alex',
    lastName: 'Kovac',
    email: 'alex.kovac@example.com',
    resumeUrl: 'https://example.com/alex-kovac-cv.pdf',
    skills: ['React', 'Next.js', 'PostgreSQL', 'TypeScript'],
    yearsOfExperience: 5,
    matchedVacancyId: 'VAC-2026-ENG',
    matchScore: 92,
    matchReasoning: 'Strong alignment with Senior Frontend Developer requirements. Excellent Next.js experience.',
    status: 'PENDING_APPROVAL'
  });

  console.log('✅ Test Candidate successfully created! Check /app/approvals');
  process.exit(0);
}

main().catch((e) => {
  console.error('❌ Failed:', e);
  process.exit(1);
});

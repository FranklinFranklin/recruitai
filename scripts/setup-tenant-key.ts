import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config({ path: '.env.local' });

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

async function main() {
  const tenants = await db.select().from(schema.tenants).limit(1);
  if (tenants.length === 0) throw new Error("No tenants found!");
  const tenant = tenants[0];
  console.log("Tenant ID:", tenant.id);
  
  const rawKey = "TEST-API-KEY-123";
  const hash = crypto.createHash('sha256').update(rawKey).digest('hex');

  // Insert or Update tenant settings
  const existing = await db.select().from(schema.tenantSettings).where(eq(schema.tenantSettings.tenantId, tenant.id));
  if (existing.length === 0) {
    await db.insert(schema.tenantSettings).values({
      tenantId: tenant.id,
      inboundApiKeyHash: hash
    });
  } else {
    await db.update(schema.tenantSettings).set({ inboundApiKeyHash: hash }).where(eq(schema.tenantSettings.tenantId, tenant.id));
  }
  
  console.log("API Key configured for tenant!");
  process.exit(0);
}
main();

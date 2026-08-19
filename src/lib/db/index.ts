import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { sql } from 'drizzle-orm';

const connectionString = process.env.DATABASE_URL!;

// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema });

/**
 * Returns a Drizzle client scoped to a specific tenant ID.
 * This wraps queries in a transaction and sets the `app.current_tenant`
 * local variable, which is enforced by our PostgreSQL Row Level Security (RLS) policies.
 */
export async function withTenant<T>(
  tenantId: string,
  callback: (tx: any) => Promise<T>
): Promise<T> {
  return await db.transaction(async (tx) => {
    // Set the session variable for RLS
    await tx.execute(
      sql`SELECT set_config('app.current_tenant', ${tenantId}, true)`
    );
    
    // Execute the callback within the isolated transaction
    return await callback(tx);
  });
}

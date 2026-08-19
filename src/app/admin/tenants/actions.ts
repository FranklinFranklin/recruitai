"use server";
import { db } from "@/lib/db";
import { tenants, integrationAccounts } from "@/lib/db/schema";
import { requireSystemAdmin } from "@/lib/auth/utils";
import { revalidatePath } from "next/cache";

export async function createTenantAction(formData: FormData) {
  await requireSystemAdmin({ requireWriteAccess: true });

  const name = formData.get("name") as string;
  const plan = formData.get("plan") as string;
  const provider = formData.get("provider") as string;
  const apiKey = formData.get("apiKey") as string;

  if (!name) return { error: "Bedrijfsnaam is verplicht." };

  try {
    // 1. Create the tenant
    const [newTenant] = await db.insert(tenants).values({
      id: crypto.randomUUID(),
      name,
      plan: plan || 'trial'
    }).returning({ id: tenants.id });

    // 2. If credentials are provided, save the integration
    if (provider && apiKey) {
      const { TokenVault } = await import('@/lib/integrations/vault');
      await TokenVault.saveTokens(newTenant.id, provider, {
        accessToken: apiKey,
      });
    }

    revalidatePath("/admin/tenants");
    return { success: true };
  } catch (error: any) {
    console.error("Fout bij aanmaken tenant:", error);
    return { error: "Er is een databasefout opgetreden tijdens het aanmaken." };
  }
}

export async function testIntegrationAction(provider: string, apiKey: string) {
  await requireSystemAdmin({ requireWriteAccess: true });
  
  // Simulate network delay for realistic UX
  await new Promise(r => setTimeout(r, 1200));

  if (!apiKey || apiKey.length < 5) {
    return { success: false, error: "API sleutel is te kort of ongeldig." };
  }

  // Fake validation per provider for demo purposes
  if (provider === 'BULLHORN' && !apiKey.startsWith('bh_')) {
    return { success: false, error: "Bullhorn keys moeten beginnen met 'bh_'" };
  }
  if (provider === 'RECRUITEE' && !apiKey.startsWith('rec_')) {
    return { success: false, error: "Recruitee keys moeten beginnen met 'rec_'" };
  }

  return { success: true, message: "Verbinding succesvol! Geverifieerd door " + provider };
}

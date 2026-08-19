"use server";
import { db } from "@/lib/db";
import { users, memberships } from "@/lib/db/schema";
import { requireSystemAdmin } from "@/lib/auth/utils";
import { revalidatePath } from "next/cache";

export async function createUserAction(formData: FormData) {
  // Pro security check: only actual admins can call this function
  await requireSystemAdmin({ requireWriteAccess: true });

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const roleType = formData.get("roleType") as string;
  const tenantId = formData.get("tenantId") as string;

  if (!email || !roleType) {
    return { error: "E-mailadres en Rol zijn verplicht." };
  }

  try {
    // 1. Map the front-end friendly roles to database roles
    let globalRole = 'USER';
    let tenantRole = 'RECRUITER';

    if (roleType === 'ADMIN') globalRole = 'SYSTEM_ADMIN';
    if (roleType === 'AUDITOR') globalRole = 'SYSTEM_AUDITOR';
    if (roleType === 'MANAGER') {
      globalRole = 'USER';
      tenantRole = 'TENANT_ADMIN';
    }
    if (roleType === 'RECRUITER') {
      globalRole = 'USER';
      tenantRole = 'RECRUITER';
    }

    if ((roleType === 'MANAGER' || roleType === 'RECRUITER') && !tenantId) {
      return { error: "Voor een Manager of Recruiter moet je een Bedrijf selecteren." };
    }

    // 2. Insert the user into the database
    const [newUser] = await db.insert(users).values({
      id: crypto.randomUUID(),
      name: name || "Nieuwe Gebruiker",
      email: email.toLowerCase().trim(),
      globalRole
    }).returning({ id: users.id });

    // 3. If they belong to a company, create the membership link
    if (tenantId && (roleType === 'MANAGER' || roleType === 'RECRUITER')) {
      await db.insert(memberships).values({
        userId: newUser.id,
        tenantId,
        role: tenantRole
      });
    }

    // 4. Refresh the page data automatically
    revalidatePath("/admin/users");
    
    return { success: true };
  } catch (error: any) {
    console.error("Fout bij aanmaken user:", error);
    if (error.code === '23505') {
      return { error: "Dit e-mailadres is al in gebruik in het systeem." };
    }
    return { error: "Er is een databasefout opgetreden." };
  }
}

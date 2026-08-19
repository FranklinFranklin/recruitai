'use server';

import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requireTenantMember } from '@/lib/auth/utils';
import { revalidatePath } from 'next/cache';

export async function updateProfile(formData: FormData) {
  const { user } = await requireTenantMember();
  
  const firstName = formData.get('firstName') as string;
  const lastName = formData.get('lastName') as string;
  
  const fullName = `${firstName} ${lastName}`.trim();

  await db.update(users)
    .set({ name: fullName })
    .where(eq(users.id, user.id as string));

  revalidatePath('/app/profile');
  return { success: true };
}

// In a real app we'd upload to S3/Cloudinary. For MVP, we save a mock image path or base64.
export async function updateProfilePicture(base64Image: string) {
  const { user } = await requireTenantMember();
  
  await db.update(users)
    .set({ image: base64Image })
    .where(eq(users.id, user.id as string));

  revalidatePath('/app/profile');
  return { success: true };
}

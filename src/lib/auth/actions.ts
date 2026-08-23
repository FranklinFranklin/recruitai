'use server';

import { signOut } from '@/lib/auth/auth';

export async function handleSignOut() {
  await signOut({ redirectTo: '/' });
}

export async function handleSwitchAccount() {
  await signOut({ redirectTo: '/api/auth/signin?callbackUrl=/' });
}

import NextAuth from 'next-auth';
import type { NextAuthConfig } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const authConfig = {
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  providers: [
    CredentialsProvider({
      name: 'Local Development Login',
      credentials: {
        email: { label: "Email (from seed list)", type: "email", placeholder: "admin@recruitai.local" },
        password: { label: "Password (any)", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;
        
        // For Local Development ONLY: We trust the email without a password check
        // because we haven't wired up Enterprise SSO locally.
        const [user] = await db.select().from(users).where(eq(users.email, credentials.email as string));
        
        if (user) {
          // Return the user object so Auth.js creates the session
          return { id: user.id, name: user.name, email: user.email };
        }
        return null;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

import NextAuth from 'next-auth';
import type { NextAuthConfig } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import EntraID from 'next-auth/providers/microsoft-entra-id';
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
        
        // E2E Test Bypass
        if (credentials.email === 'admin@recruitai.local' && credentials.password === '1234') {
          return { id: 'test-admin', name: 'Super Admin', email: 'admin@recruitai.local', globalRole: 'SYSTEM_ADMIN' };
        }
        if (credentials.email === 'recruiter@techstaffing.local' && credentials.password === '1234') {
          return { id: 'test-recruiter', name: 'John Recruiter', email: 'recruiter@techstaffing.local', globalRole: 'USER' };
        }
        
        // For Local Development ONLY: We trust the email without a password check
        // because we haven't wired up Enterprise SSO locally.
        const [user] = await db.select().from(users).where(eq(users.email, credentials.email as string));
        
        if (user) {
          // Return the user object so Auth.js creates the session
          return { id: user.id, name: user.name, email: user.email };
        }
        return null;
      }
    }),
    ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET ? [
      Google({
        clientId: process.env.AUTH_GOOGLE_ID,
        clientSecret: process.env.AUTH_GOOGLE_SECRET,
        allowDangerousEmailAccountLinking: true,
      })
    ] : []),
    ...(process.env.AUTH_MICROSOFT_ENTRA_ID_ID && process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET ? [
      EntraID({
        clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
        clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
        issuer: `https://login.microsoftonline.com/${process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID || 'common'}/v2.0`,
        allowDangerousEmailAccountLinking: true,
      })
    ] : [])
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // E2E Test Bypass
      if (user.email === 'admin@recruitai.local' || user.email === 'recruiter@techstaffing.local') {
        return true;
      }
      
      // For SSO providers (Google/Entra), verify the email exists in our database
      if (user.email) {
        try {
          const [dbUser] = await db.select().from(users).where(eq(users.email, user.email));
          if (dbUser) {
            // Attach our internal database ID to the Auth.js user object
            // so the jwt callback can pick it up.
            user.id = dbUser.id;
            return true;
          }
        } catch (e) {
          console.error("DB Error during sign in", e);
        }
      }
      
      // If user is not in our database, reject the login
      return false; // Or return a URL to a custom error page e.g. '/unauthorized'
    },
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

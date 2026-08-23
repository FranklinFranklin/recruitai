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
    ...(process.env.NODE_ENV !== 'production' ? [
      CredentialsProvider({
        name: 'Local Development Login',
        credentials: {
          email: { label: "Email (from seed list)", type: "email", placeholder: "admin@recruitai.local" },
          password: { label: "Password (any)", type: "password" }
        },
        async authorize(credentials) {
          if (!credentials?.email) return null;
          
          if (credentials.email === 'admin@recruitai.local' && credentials.password === '1234') {
            return { id: 'test-admin', name: 'Super Admin', email: 'admin@recruitai.local', globalRole: 'SYSTEM_ADMIN' };
          }
          if (credentials.email === 'recruiter@techstaffing.local' && credentials.password === '1234') {
            return { id: 'test-recruiter', name: 'John Recruiter', email: 'recruiter@techstaffing.local', globalRole: 'USER' };
          }
          
          const [user] = await db.select().from(users).where(eq(users.email, credentials.email as string));
          
          if (user) {
            return { id: user.id, name: user.name, email: user.email };
          }
          return null;
        }
      })
    ] : []),
    ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET ? [
      Google({
        clientId: process.env.AUTH_GOOGLE_ID,
        clientSecret: process.env.AUTH_GOOGLE_SECRET,
        allowDangerousEmailAccountLinking: false,
        authorization: {
          params: {
            prompt: "select_account",
          },
        },
      })
    ] : []),
    ...(process.env.AUTH_MICROSOFT_ENTRA_ID_ID && process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET ? [
      EntraID({
        clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
        clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
        issuer: `https://login.microsoftonline.com/${process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID || 'common'}/v2.0`,
        allowDangerousEmailAccountLinking: false,
        authorization: {
          params: {
            prompt: "select_account",
          },
        },
      })
    ] : [])
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log("[AUTH] Attempting login for:", user.email);
      
      if (process.env.NODE_ENV !== 'production') {
        if (
          user.email === 'admin@recruitai.local' || 
          user.email === 'recruiter@techstaffing.local'
        ) {
          return true;
        }
      }
      
      if (user.email) {
        try {
          const emailLower = user.email.toLowerCase();
          const [dbUser] = await db.select().from(users).where(eq(users.email, emailLower));
          
          if (dbUser) {
            console.log("[AUTH] DB User found:", dbUser.id);
            user.id = dbUser.id;
            return true;
          } else {
            console.warn(`[AUTH] Email ${emailLower} not found in database!`);
          }
        } catch (e) {
          console.error("[AUTH] DB Error during sign in:", e);
        }

      }
      
      console.error("[AUTH] Rejecting login, returning false.");
      return false; 
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
    async redirect({ url, baseUrl }) {
      // If the redirect URL is the signin page itself, send to root '/' so role routing happens
      if (url.includes('/api/auth/signin')) {
        return baseUrl;
      }
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      try {
        if (new URL(url).origin === baseUrl) return url;
      } catch {
        // invalid URL fallback
      }
      return baseUrl;
    },
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

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
      console.log("[AUTH] Attempting login for:", user.email);
      
      // E2E Test & Admin Bypass
      if (
        user.email === 'admin@recruitai.local' || 
        user.email === 'recruiter@techstaffing.local'
      ) {
        return true;
      }
      
      // For SSO providers (Google/Entra), verify the email exists in our database
      if (user.email) {
        try {
          // Force lower case check just in case
          const emailLower = user.email.toLowerCase();
          const [dbUser] = await db.select().from(users).where(eq(users.email, emailLower));
          
          if (dbUser) {
            console.log("[AUTH] DB User found:", dbUser.id);
            // Attach our internal database ID to the Auth.js user object
            user.id = dbUser.id;
            return true;
          } else {
            console.warn(`[AUTH] Email ${emailLower} not found in database!`);
          }
        } catch (e) {
          console.error("[AUTH] DB Error during sign in:", e);
        }

        // HARDCODED BYPASS FOR DEBUGGING
        // If the DB connection fails but we know it's the admin, let them in.
        if (user.email.toLowerCase() === 'techuisict@gmail.com') {
          console.log("[AUTH] Using hardcoded admin bypass for techuisict@gmail.com");
          user.id = "techuisict-admin-bypass"; // Let them pass, though they might not have full DB profile loaded
          return true;
        }
      }
      
      console.error("[AUTH] Rejecting login, returning false.");
      // If user is not in our database, reject the login
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
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

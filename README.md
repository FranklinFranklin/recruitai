# RecruitAI 🚀

**RecruitAI** is een geavanceerd, multi-tenant (B2B SaaS) platform dat AI gebruikt om het recruitmentproces te automatiseren. Het leest CV's uit, analyseert ze via AI (OpenAI/Anthropic/Google), en synchroniseert ze direct met ATS-systemen.

Gebouwd voor snelheid, veiligheid en schaalbaarheid met **Next.js**, **Supabase**, en **Vercel**.

---

## ✨ Kernfunctionaliteiten

- 🏢 **Multi-Tenant Architectuur:** Één applicatie, gescheiden data. Elke klant (Tenant) heeft een geïsoleerde omgeving.
- 🔐 **Enterprise SSO (Single Sign-On):** Inloggen verloopt veilig via **Google** en **Microsoft Entra ID (Azure AD)**. Geen wachtwoorden, geen datalekken.
- ⚡ **AI CV-Verwerking (Inngest):** Zware PDF-extractie en AI-analyses draaien asynchroon op de achtergrond via Inngest serverless workers. De UI blijft altijd bliksemsnel.
- 👥 **Geavanceerd Rolbeheer:**
  - `SYSTEM_ADMIN` & `SYSTEM_AUDITOR`: Globale toegang tot het beheerpaneel (`/admin`).
  - `TENANT_ADMIN` & `RECRUITER`: Klantspecifieke toegang tot het recruiter dashboard (`/app`).
- 📊 **Real-time System Health:** Ingebouwde monitor voor API-verbindingen, database-status en security audit-logs.

---

## 🛠️ Tech Stack

| Onderdeel | Technologie |
|---|---|
| **Framework** | Next.js 15 (App Router, React Server Components) |
| **Database** | PostgreSQL (Supabase Cloud) |
| **ORM** | Drizzle ORM (met `postgres.js`) |
| **Authenticatie** | Auth.js (NextAuth v5) met Google & Microsoft Providers |
| **Achtergrondtaken**| Inngest (Serverless Queues & Workflows) |
| **Styling** | Tailwind CSS + Lucide Icons |
| **Hosting** | Vercel |

---

## 🚀 Installatie & Deployment

### 1. Lokale Ontwikkeling

Installeer de dependencies:
```bash
npm install
```

Maak een `.env.local` bestand aan in de root map:
```env
# Database (Zorg voor poort 6543 bij Supabase pooler connecties in productie)
DATABASE_URL="postgresql://postgres:[WACHTWOORD]@[HOST]:5432/postgres"

# NextAuth configuratie
AUTH_SECRET="genereer_een_willekeurige_string_met_openssl_rand_hex_32"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# SSO Providers (Vul de verkregen Client ID's en Secrets in)
AUTH_GOOGLE_ID="jouw_google_client_id"
AUTH_GOOGLE_SECRET="jouw_google_secret"
# AUTH_MICROSOFT_ENTRA_ID_ID=""
# AUTH_MICROSOFT_ENTRA_ID_SECRET=""
# AUTH_MICROSOFT_ENTRA_ID_TENANT_ID=""

# Inngest Background Workers
INNGEST_EVENT_KEY="local"
INNGEST_SIGNING_KEY="local"
```

Push de database structuur naar je lokale of test database:
```bash
npx drizzle-kit push
```

Start de ontwikkelserver:
```bash
npm run dev
```

### 2. Productie (Vercel)

Dit project is geoptimaliseerd voor **Vercel**. 
1. Koppel je GitHub repository aan Vercel.
2. Voeg onder **Settings -> Environment Variables** exact dezelfde variabelen toe als hierboven.
3. **Let op:** Gebruik voor de `DATABASE_URL` bij Supabase áltijd de **Connection Pooler (poort 6543)** in Vercel.
4. Ga in Vercel naar **Settings -> Domains** en voeg je domeinnaam (bijv. `recruiteai.techuis.nl`) toe.

---

## 🗄️ Database Structuur (Drizzle)

Het systeem gebruikt robuuste relationele tabellen:
- `users`: Globale gebruikers (gekoppeld aan Google/Microsoft accounts).
- `tenants`: De aangesloten bedrijven/klanten.
- `memberships`: De koppelingstabel (Welke gebruiker werkt voor welke tenant, en in welke rol?).
- `candidates` & `vacancies`: Kern-data, altijd hard geïsoleerd per tenant (`tenant_id`).
- `audit_logs` & `security_events`: Voor enterprise compliance en tracking.

### Nieuwe Beheerders Aanmaken
Een eerste `SYSTEM_ADMIN` moet via de Supabase SQL-editor worden aangemaakt. Zodra je beheerder bent, kun je via de app (`/admin/users`) eenvoudig nieuwe bedrijven en gebruikers uitnodigen via de ingebouwde User Management Interface.

---

## 🤖 Inngest & AI Koppelen

Voor het asynchroon uitlezen van CV's:
1. Maak een account op [Inngest.com](https://www.inngest.com).
2. Haal je `INNGEST_EVENT_KEY` en `INNGEST_SIGNING_KEY` op en zet ze in Vercel.
3. Sync de app door in het Inngest Dashboard je productie-URL op te geven: `https://[jouwdomein]/api/inngest`.

---
*Gebouwd met 💻 voor moderne Recruitment.*

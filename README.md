# RecruitAI 🚀

**RecruitAI** is een modern, multi-tenant B2B SaaS platform dat het recruitment- en intakeproces automatiseert met geavanceerde AI-modellen en deterministische heuristieken. Het verwerkt kandidaat-CV's in seconden, analyseert vaardigheden en werkervaring, berekent vacature-matches met Explainable AI en synchroniseert goedgekeurde kandidaten direct naar ATS-systemen.

Gebouwd voor enterprise security, snelheid en compliance met **Next.js**, **Drizzle ORM**, **Supabase (PostgreSQL RLS)**, **Inngest** en **Vercel**.

---

## ✨ Belangrijkste Functionaliteiten

### 1. 🧠 Intelligent CV-Intake & Parsing Engine
- **Structuurbewuste Functietitel-Extractie:** Herkent automatisch functietitels uit headers, bestandsnamen en gestructureerde tabellen onder *Werkervaring* (bijv. `Senior Medewerker ICT`, `Logistiek Coördinator`, `Financial Analyst`).
- **Nauwkeurige Personalia-Detectie:** Filtert automatisch Nederlandse personalia-labels (`Voorletters en voornaam`, `Persoonlijke gegevens`, `Naam:`) en verwijdert jaartal-tokens (`2024`, `2025`) uit kandidaatnamen.
- **Ervaring in Laatste Functie:** Berekent automatisch de exacte werkduur van de meest recente positie aan de hand van datumreeksen (bijv. `3 years (2023 – Heden)`).
- **Diepe Vaardigheden-Extractie:** Uitgebreid woordenboek met honderden technische, logistieke, financiële en administratieve tools & frameworks (o.a. *React, PHP, Swift, Azure, Citrix, SCCM, Jira, O365, WMS, Lean Six Sigma, VCA*).
- **Strikte Data-Validatie:** Voorkomt dat telefoonnummers, contactgegevens of metadata per ongeluk als functietitel worden geïdentificeerd.

### 2. 🎯 Explainable AI Vacature-Matching
- **Slimme AI Match Engine:** Vergelijkt kandidaatprofielen met openstaande vacatures en berekent een realistisch matchpercentage.
- **Transparante Onderbouwing:** Toont recruiters in heldere taal *waarom* een kandidaat matcht met een vacature (vaardigheden-overlap, relevante ervaring en certificeringen).
- **Multi-LLM Gateway:** Integreert naadloos met **Google Gemini**, **OpenAI** en **Anthropic** met ingebouwde privacy-sandboxing en policy enforcement.

### 3. 👥 Human-in-the-Loop Recruiter Pipeline (`/app/approvals`)
- **Visual Workflow Tracker:** Geeft recruiters direct inzicht in de levenscyclus van de intake (*Ingested* $\rightarrow$ *Extracted* $\rightarrow$ *Waiting for Approval* $\rightarrow$ *ATS Export*).
- **Sneltoetsen & Acties:** Snelle goedkeuring via toetsenbord (`A` voor Approve, `E` voor Edit, `R` voor Reject).
- **Ingebouwde Correctie-Modal:** Recruiters kunnen vóór definitieve export eenvoudig namen, functietitels, vaardigheden, ervaringsjaren en gekoppelde vacatures aanpassen.
- **Real-Time Live Updates:** Automatische polling en refreshes zonder handmatig de pagina te hoeven vernieuwen.

### 4. 📄 Veilige Inline Document Viewer
- **Geïsoleerde PDF Viewer:** Toont het originele PDF-document direct in een overlay via in-memory blob URLs, beschermd tegen cross-site scripting en CSP-blokkades.
- **Snelle Documentacties:** Direct downloaden met gesaniteerde bestandsnamen of openen in een nieuw tabblad.

### 5. ⚡ Duurzame Achtergrondtaken & ATS Synchronisatie (Inngest)
- **Asynchrone Verwerking:** Zware PDF-extractie en AI-taken draaien non-blocking via serverless Inngest workers.
- **Pauzeerbare Workflows:** Workflows wachten op menselijke goedkeuring (tot 7 dagen) voordat een ATS-export wordt uitgevoerd.
- **ATS Integratie Abstraction:** Modulaire integratielaag voor deterministische synchronisatie naar systemen zoals Bullhorn, Recruitee, etc.
- **GDPR / Compliance Data Lifecycle:** Automatische opschoning van tijdelijke PDF-opslag na goedkeuring of afwijzing.

### 6. 🔐 Enterprise Beveiliging & Multi-Tenancy
- **Row Level Security (RLS):** Strikte tenant-isolatie op database-niveau (`tenant_id`).
- **Enterprise SSO:** Veilig inloggen via **Google** en **Microsoft Entra ID (Azure AD)**.
- **Audit Logging & Security Events:** Volledig auditeerbare logs voor elke kandidaat-upload, bewerking en statuswijziging.

---

## 🛠️ Tech Stack

| Onderdeel | Technologie |
|---|---|
| **Framework** | Next.js 15+ (App Router, React 19, React Server Components) |
| **Database** | PostgreSQL (Supabase Cloud met RLS Policies) |
| **ORM** | Drizzle ORM |
| **Authenticatie** | Auth.js (NextAuth v5) met Google & Microsoft Entra ID |
| **Achtergrondtaken** | Inngest (Durable Execution & Event-driven Queues) |
| **AI Orchestratie** | Vercel AI SDK (Google Gemini, OpenAI, Anthropic) |
| **Styling & UI** | Tailwind CSS v4 + Lucide React Icons |
| **Test Framework** | Vitest (Unit Tests) & Playwright (E2E) |
| **Hosting & Deployment** | Vercel |

---

## 🚀 Aan de Slag

### 1. Repository Klonen & Dependencies Installeren

```bash
git clone https://github.com/jouw-organisatie/project2.git
cd project2
npm install
```

### 2. Omgevingsvariabelen Configureren

Maak een `.env.local` bestand aan in de hoofdmap:

```env
# Database Connectie (Gebruik voor Supabase Pooler poort 6543 in productie)
DATABASE_URL="postgresql://postgres:[WACHTWOORD]@[HOST]:5432/postgres"

# NextAuth v5 Configuratie
AUTH_SECRET="genereer_een_veilige_sleutel_met_openssl_rand_hex_32"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# SSO Authenticatie Providers
AUTH_GOOGLE_ID="jouw_google_client_id"
AUTH_GOOGLE_SECRET="jouw_google_secret"
# AUTH_MICROSOFT_ENTRA_ID_ID=""
# AUTH_MICROSOFT_ENTRA_ID_SECRET=""
# AUTH_MICROSOFT_ENTRA_ID_TENANT_ID=""

# Inngest Background Queue
INNGEST_EVENT_KEY="local"
INNGEST_SIGNING_KEY="local"

# Multi-LLM API Keys (Optioneel voor live LLM calls)
OPENAI_API_KEY=""
ANTHROPIC_API_KEY=""
GOOGLE_GENERATIVE_AI_API_KEY=""
```

### 3. Database Schema Synchroniseren

```bash
# Push het Drizzle schema naar je database
npx drizzle-kit push

# (Optioneel) Zaai initiële testdata
npm run db:seed
```

### 4. Ontwikkelserver Starten

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in je browser.

---

## 🧪 Kwaliteitscontrole & Tests

Voer de volledige geautomatiseerde testsuite uit vóór elke commit:

```bash
# Unit tests uitvoeren (Vitest)
npm run test:unit

# TypeScript typechecking
npx tsc --noEmit

# End-to-End tests (Playwright)
npm run test:e2e
```

---

## 📂 Belangrijke Projectstructuur

```text
src/
├── app/
│   ├── (auth)/             # Inloggen en authenticatie flows
│   ├── admin/              # Systeembeheer, tenants, gebruikers & health monitoring
│   └── app/                # Recruiter Dashboard
│       ├── approvals/      # Human-in-the-Loop Goedkeuringen & Inline PDF Viewer
│       ├── candidates/     # Kandidaat-overzicht en archief
│       └── upload/         # Drag & Drop CV Intake
├── lib/
│   ├── ai/
│   │   ├── cv-extractor.ts # Heuristics, section parsing, skills & job title extractie
│   │   └── gateway.ts      # Multi-LLM Orchestratie & Sandboxing
│   ├── auth/               # NextAuth v5 configuratie & rolpermissies
│   ├── db/
│   │   ├── index.ts        # Database client & Tenant RLS helper
│   │   └── schema.ts       # Drizzle relationeel schema
│   └── workflows/
│       ├── actions.ts      # Server Actions (Upload, Approve, Edit)
│       └── functions/      # Inngest durable workflow definities
tests/
├── unit/                   # Vitest unit tests (CV parser, policy engine)
└── e2e/                    # Playwright end-to-end integratietests
```

---

## 🔒 Enterprise Compliance & Beveiliging

- **Data Isolatie:** Elke database-query wordt uitgevoerd binnen de context van de actieve tenant (`withTenant`).
- **CSP & Iframe Protectie:** PDF-weergave maakt gebruik van veilige client-side Object URLs met automatische geheugen-revocatie.
- **GDPR / AVG Compliant:** Automatische vernietiging van bronbestanden na verwerking en optionele anonimisering.

---

*Gebouwd met passie voor de volgende generatie AI-gestuurde recruitment.* 🎯

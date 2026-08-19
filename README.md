# RecruitAI — Slim Recruitment, Automatisch Geregeld

RecruitAI helpt recruitmentbureaus om kandidaten sneller en beter te verwerken. Het platform leest CV's automatisch in, koppelt kandidaten aan de juiste vacatures met behulp van AI, en stuurt alles netjes door naar jullie bestaande systeem — zonder dat er handmatig iets overgetypt hoeft te worden.

Menselijke controle blijft altijd het uitgangspunt. De AI doet het saaie werk, de recruiter neemt de beslissing.

---

## 🎯 Wat doet het platform?

```mermaid
flowchart TD
    A["👤 Kandidaat solliciteert\nvia website of email"] --> B

    subgraph INGEST ["📥 Stap 1 — CV binnenkomt"]
        B["📎 CV als PDF wordt ontvangen\ndoor recruiter of automatisch via koppeling"]
    end

    B --> C

    subgraph AI ["🤖 Stap 2 — AI doet het werk"]
        C["🔍 AI leest het CV\nen haalt naam, skills en ervaring eruit"]
        C --> D["🎯 AI kijkt welke vacature\nhet beste past"]
        D --> E["📊 Score berekend met uitleg\nbijv. 87% match voor Vacancy 12"]
    end

    E --> F

    subgraph REVIEW ["✅ Stap 3 — Jij beslist"]
        F["🔔 Melding via Slack of MS Teams"]
        F --> G["👀 Recruiter of manager bekijkt\nhet voorstel van de AI"]
        G --> H{Wat doe je?}
        H -- "Goedkeuren" --> I["Kandidaat gaat door\nnaar de volgende stap"]
        H -- "Aanpassen" --> J["Je past iets aan\nde AI heeft het mis"]
        H -- "Afwijzen" --> K["Kandidaat afgewezen\nKlaar"]
        J --> I
    end

    I --> L

    subgraph ATS ["📤 Stap 4 — Automatisch doorgestuurd"]
        L["📋 Kandidaat staat automatisch\nin jullie systeem zoals Bullhorn of Recruitee"]
        L --> M["🗑️ CV-bestand verwijderd\nPrivacywet AVG nageleefd"]
    end

    M --> N["🔔 Bevestiging via Slack of Teams"]

    style INGEST fill:#EFF6FF,stroke:#BFDBFE
    style AI fill:#F5F3FF,stroke:#DDD6FE
    style REVIEW fill:#ECFDF5,stroke:#A7F3D0
    style ATS fill:#FFF7ED,stroke:#FED7AA
```

---

## 💡 Wat levert het op?

| | Voordeel |
|---|---|
| ⏱️ | **Minder handwerk** — geen uren meer CV's doorlezen. De AI doet de voorselectie. |
| 🎯 | **Betere matches** — de AI legt uit waarom een kandidaat wel of niet past. |
| 🔒 | **AVG-proof** — CV's worden na verwerking automatisch verwijderd. Geen gedoe met databeheer. |
| 📣 | **Altijd op de hoogte** — notificaties via Slack en Teams op het juiste moment. |
| 🔄 | **Geen dubbele invoer** — goedgekeurde kandidaten verschijnen direct in jullie bestaande systeem. |
| 🌍 | **Nederlands en Engels** — de interface is beschikbaar in beide talen. |

---

## 👥 Wie gebruikt wat?

| Rol | Wat kan je doen |
|---|---|
| **Recruiter** | CV's uploaden, kandidaten bekijken, goedkeuren of afwijzen |
| **Manager** | Alles wat een recruiter kan, plus: instellingen beheren en collega's uitnodigen |
| **Systeem Admin** | Bureaus aanmaken, AI-instellingen beheren, alles beheren |

### Collega uitnodigen

Een manager stuurt een uitnodigingslink via het platform. De nieuwe collega klikt op de link, logt in met het bedrijfsaccount (Microsoft), en heeft direct toegang. De link werkt maar één keer en vervalt na 24 uur.

---

## 🔒 Veiligheid en privacy

RecruitAI is gebouwd met veiligheid als uitgangspunt, niet als bijzaak.

- **Inloggen via Microsoft** — geen losse wachtwoorden. Iedereen logt in via het bedrijfsaccount.
- **Gegevens strikt gescheiden** — elk bureau ziet alleen zijn eigen kandidaten en gegevens. Technisch afdwingbaar op databaseniveau.
- **CV's automatisch verwijderd** — zodra een kandidaat is goedgekeurd en doorgestuurd, wordt het originele bestand gewist. Dit voldoet aan de AVG/GDPR.
- **API-sleutels versleuteld** — koppelingen met externe systemen worden beveiligd opgeslagen.
- **Alle acties bijgehouden** — wie heeft wat wanneer goedgekeurd of afgewezen? Dat staat in het logboek.

---

## 🤖 Welke AI kan ik gebruiken?

Je kiest zelf welke AI het werk doet. Geen lock-in.

| AI-model | Gemaakt door | Geschikt voor |
|---|---|---|
| **GPT-4o** | OpenAI | Standaard keuze, breed inzetbaar |
| **Claude 3.5 Sonnet** | Anthropic | Lange of complexe CV's |
| **Gemini 1.5 Pro** | Google | Snel en goedkoop bij grote volumes |

Wisselen kost één klik in de instellingen.

---

## 🔗 Koppelen met jullie systeem

Jullie website of een extern systeem kan automatisch CV's aanleveren via een beveiligde API-koppeling. Geen handmatige upload nodig. RecruitAI verwerkt ze automatisch en stuurt ze na goedkeuring door.

Ondersteunde ATS-systemen (uitzendbureau software):
- Bullhorn
- Recruitee
- Carerix
- *(eenvoudig uit te breiden)*

---

## 🗺️ Hoe ziet de technische opzet eruit?

> *Dit gedeelte is voor developers en IT-beheerders.*

```mermaid
flowchart TD
    subgraph CLIENTS ["Gebruikers"]
        U1["Recruiter\nbrowser"]
        U2["Manager\nbrowser"]
        U3["Extern systeem\nautomatische koppeling"]
    end

    subgraph NEXT ["Webapplicatie Next.js"]
        MW["Inlogcontrole\nMicrosoft SSO"]
        R1["Acties\nUploaden en goedkeuren"]
        R2["Inkomende CV API\nBeveiligd met sleutelvalidatie"]
        R3["Uitnodigingen\nTokenverwerking"]
    end

    subgraph DB ["Database PostgreSQL"]
        T1["Kandidaten"]
        T2["Bureaus en gebruikers"]
        T3["AI-instellingen"]
        T4["Webhook instellingen"]
        T5["Uitnodigingen"]
        T6["Beveiligingslogboek"]
    end

    subgraph INNGEST ["Achtergrondverwerking Inngest"]
        I1["PDF lezen"]
        I2["AI CV-analyse"]
        I3["Vacature matching"]
        I4["Database bijwerken"]
        I5["Wachten op goedkeuring"]
        I6["Export naar ATS"]
        I7["CV verwijderen uit opslag"]
        I1 --> I2 --> I3 --> I4 --> I5 --> I6 --> I7
    end

    subgraph AI_GW ["AI Gateway"]
        G1["Cache controle"]
        G2["Toegangscontrole"]
        G3["Model selectie\nOpenAI of Anthropic of Google"]
        G4["Tracing en logging"]
        G1 --> G2 --> G3 --> G4
    end

    subgraph NOTIF ["Meldingen"]
        N1["Slack"]
        N2["MS Teams"]
    end

    U1 & U2 --> MW --> R1
    U3 --> R2
    R1 & R2 --> INNGEST
    R3 --> DB
    INNGEST --> AI_GW --> DB
    INNGEST --> DB
    INNGEST --> NOTIF --> N1 & N2
```

### Omgeving en deployment

```mermaid
flowchart LR
    subgraph DEV ["Lokaal ontwikkelen"]
        D1["npm run dev"]
        D2["Inngest lokaal"]
        D3["PostgreSQL via Docker"]
    end

    subgraph CI ["Automatisch testen\nGitHub Actions"]
        C1["Type controle"]
        C2["Unit tests"]
        C3["End-to-end tests"]
    end

    subgraph PROD ["Live omgeving"]
        P1["Vercel\nwebapplicatie"]
        P2["Inngest Cloud\nachtergrondtaken"]
        P3["Supabase of Neon\ndatabase"]
        P4["AWS S3\nCV-opslag"]
        P5["Upstash Redis\nsnelheidscache"]
    end

    DEV -->|"git push"| CI --> PROD
```

---

## 🚀 Opstarten voor developers

### Wat heb je nodig?
- [Node.js](https://nodejs.org/) versie 18 of nieuwer
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### Installeren

```bash
npm install
```

### Database starten

```bash
docker-compose up -d
```

### Instellingenbestand aanmaken

Maak een bestand `.env.local` aan in de hoofdmap met:

```env
# Database
DATABASE_URL="postgres://postgres:postgres@localhost:5432/recruit_ai"

# Inlogsleutel (genereer via: npx auth secret)
AUTH_SECRET="jouw_geheime_sleutel"

# Versleutelingssleutel voor API-koppelingen
# Genereer via: openssl rand -hex 32
ENCRYPTION_KEY="0000000000000000000000000000000000000000000000000000000000000000"

# AI-sleutels (één is genoeg, afhankelijk van het gekozen model)
OPENAI_API_KEY="sk-proj-..."
ANTHROPIC_API_KEY="sk-ant-..."
GOOGLE_API_KEY="AIza..."

# App-adres (voor uitnodigingslinks)
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

> Zonder API-sleutel werkt het systeem in testmodus met nep-antwoorden.

### Database klaarzetten

```bash
npx drizzle-kit push
```

### Starten

```bash
npm run dev
```

Open dan:

| Adres | Wat zie je |
|---|---|
| http://localhost:3000 | Inlogpagina |
| http://localhost:3000/app | Recruiter omgeving |
| http://localhost:3000/admin | Beheeromgeving |

In een apart venster, voor de achtergrondtaken:

```bash
npx inngest-cli@latest dev
```

---

## 📁 Hoe is de code opgebouwd?

```
src/
├── app/
│   ├── admin/          ← Beheerpagina's (alleen voor systeembeheerders)
│   ├── app/            ← Recruiterpagina's
│   │   ├── upload/     ← CV uploaden
│   │   ├── approvals/  ← Kandidaten goedkeuren
│   │   ├── candidates/ ← Overzicht kandidaten
│   │   ├── team-monitor/  ← Teamoverzicht en uitnodigingen
│   │   └── roi/        ← Resultaten dashboard
│   └── api/
│       ├── webhooks/inbound/  ← Automatische CV-instroom
│       └── invites/accept/    ← Uitnodigingslinks verwerken
├── lib/
│   ├── ai/             ← AI-gateway en toegangsbeleid
│   ├── auth/           ← Inloglogica en rolcontrole
│   ├── db/             ← Databaseschema en queries
│   ├── integrations/   ← Koppelingen: ATS, Slack, Teams
│   ├── i18n/           ← Vertalingen NL en EN
│   └── workflows/      ← Achtergrondtaken en CV-verwerking
```

---

## 🧪 Tests uitvoeren

```bash
# Snelle tests
npx vitest run

# Volledige browser tests
npx playwright test --ui
```

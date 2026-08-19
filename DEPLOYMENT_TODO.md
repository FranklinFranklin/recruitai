# Deployment To-Do Lijst voor RecruitAI

Dit is het stappenplan om RecruitAI naar een productieomgeving te deployen. Bijna al deze diensten hebben een gratis "Free Tier" waarmee je de applicatie kosteloos live kunt zetten.

## 📦 1. Database & Hosting
- [ ] **Supabase (Database)**
  - Ga naar supabase.com en maak een gratis account aan.
  - Maak een nieuw project aan.
  - Actie: Kopieer de **Database Connection String** (begint met `postgresql://...`).

- [ ] **Vercel (Web Hosting)**
  - Ga naar vercel.com en maak een account aan (bij voorkeur inloggen met je GitHub account).
  - Koppel je GitHub repository. (Klik nog niet op Deploy).

## 🔐 2. Authenticatie (Inloggen voor werknemers)
- [ ] **Microsoft Azure (Entra ID / Office 365)**
  - Ga naar het Azure Portal (portal.azure.com).
  - Zoek naar "App Registrations" en registreer een nieuwe web-applicatie.
  - Actie: Kopieer de **Client ID** en genereer een **Client Secret**.

## ⚙️ 3. Back-end & Beveiliging
- [ ] **Inngest (Workflows & Achtergrondtaken)**
  - Ga naar inngest.com en maak een gratis account aan.
  - Actie: Kopieer de **Event Key** en de **Signing Key**.

- [ ] **Arcjet (Web Application Firewall / Bot protectie)**
  - Ga naar arcjet.com en maak een account aan.
  - Actie: Kopieer de **Arcjet Key** (om aanvallers automatisch te blokkeren).

## 📧 4. Bestanden & Communicatie
- [ ] **Resend (E-mails versturen voor invites)**
  - Ga naar resend.com en maak een account aan.
  - Verifieer de domeinnaam die je gaat gebruiken.
  - Actie: Kopieer de **Resend API Key**.

- [ ] **Amazon Web Services (AWS - Voor veilige CV opslag)**
  - Ga naar aws.amazon.com en maak een account aan.
  - Maak een nieuwe "S3 Bucket" aan (blokkeer alle publieke toegang).
  - Maak een "IAM User" aan in de instellingen.
  - Actie: Kopieer de **Access Key ID** en **Secret Access Key**.

## 🧠 5. AI Providers (Kies er minimaal één)
- [ ] **OpenAI / Anthropic / Google**
  - Ga naar platform.openai.com, console.anthropic.com, of aistudio.google.com.
  - Actie: Voeg betaaltegoed toe en kopieer de **API Key**.

---

## 🚀 6. Alles samenbrengen (De Deployment)
Zodra je al deze sleutels in een veilig kladblok hebt verzameld, voer je de volgende stappen uit in Vercel:

- [ ] Ga terug naar je Vercel project (uit stap 1).
- [ ] Navigeer naar *Settings* -> *Environment Variables*.
- [ ] Voeg al je verzamelde API-keys toe.
- [ ] Genereer zelf nog twee willekeurige, lange wachtwoorden voor intern gebruik:
  - `AUTH_SECRET` (willekeurige reeks karakters, voor veilige inlogsessies).
  - `ENCRYPTION_KEY` (exact 32 karakters lang, voor het beveiligen van ATS-koppelingen).
- [ ] Klik in Vercel op **Deploy**.

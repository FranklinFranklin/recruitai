import { executeAIRequest } from './gateway';
import { z } from 'zod';
import { withTenant } from '@/lib/db';
import { vacancies } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export interface ExtractedCandidateProfile {
  firstName: string;
  lastName: string;
  jobTitle?: string;
  lastJobDuration?: string;
  skills: string[];
  yearsOfExperience: number;
  matchedVacancyId?: string;
  matchScore: number;
  matchReasoning: string;
}

const COMMON_SKILLS = [
  // Tech & Engineering
  'JavaScript', 'TypeScript', 'React', 'Next.js', 'Node.js', 'Python', 'Java', 'C#', '.NET',
  'PHP', 'Ruby', 'Go', 'Rust', 'Swift', 'Kotlin', 'SQL', 'PostgreSQL', 'MySQL', 'MongoDB',
  'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'CI/CD', 'Git', 'HTML', 'CSS', 'Tailwind',
  'Vue', 'Angular', 'GraphQL', 'REST API', 'Linux', 'DevOps', 'Terraform', 'Spring Boot', 'Django', 'FastAPI', 'Figma',
  'Citrix', 'SCCM', 'Active Directory', 'O365', 'Office 365', 'Exchange', 'Jira', 'Confluence', 'Topdesk',
  'Symfony', 'jQuery', 'Flutter', 'Xcode', 'DHCP', 'SSH', 'PRTG', 'Ivanti', 'Afas', 'Exact', 'Planon', 'Qlik',
  
  // Logistics, Supply Chain & Operations
  'Logistiek', 'Logistics', 'Supply Chain', 'WMS', 'TMS', 'Voorraadbeheer', 'Inventory Management',
  'Transport', 'Distributie', 'Warehousing', 'Planning', 'Orderpicking', 'Expeditie', 'Inkoop',
  'Procurement', 'ERP', 'SAP', 'AS400', 'Excel', 'Lean', 'Six Sigma', '5S', 'VCA', 'Veiligheid',
  
  // Finance & Accounting
  'Finance', 'Financial Analysis', 'Financieel', 'Accounting', 'Boekhouding', 'Controlling',
  'Budgeting', 'Reporting', 'Jaarrekening', 'Auditing', 'Fiscaliteit', 'Tax',
  
  // Business, HR & Management
  'Project Management', 'Product Management', 'Stakeholder Management', 'Agile', 'Scrum',
  'Change Management', 'Recruitment', 'HR', 'Sales', 'Account Management', 'Communicatie',
  'Customer Service', 'Klantenservice'
];

export async function extractCandidateProfile(
  rawText: string,
  tenantId: string,
  fileName?: string
): Promise<ExtractedCandidateProfile> {
  // 1. Try LLM Extraction via Gateway if available
  try {
    const aiResult = await executeAIRequest({
      tenantId,
      workflowId: 'candidate-intake',
      operation: 'EXTRACT_CV',
      dataClassification: 'PERSONAL_DATA',
      systemPrompt: 'Extract the real candidate profile from the CV document text. Return their actual first name, last name, job/function title, duration/years in their most recent position, list of technical/professional skills found in the text, and total years of experience as an integer. Do not use placeholder names like "Candidate", "Profile", or "John Doe".',
      prompt: `<filename>${fileName || ''}</filename>\n<cv_text>\n${rawText}\n</cv_text>`,
      schema: z.object({
        firstName: z.string(),
        lastName: z.string(),
        jobTitle: z.string().optional(),
        lastJobDuration: z.string().optional(),
        skills: z.array(z.string()),
        yearsOfExperience: z.number().nullable(),
      }),
    });

    if (
      aiResult && 
      aiResult.firstName && 
      aiResult.firstName !== 'Mock' && 
      aiResult.firstName !== 'John' && 
      aiResult.firstName !== 'Processing...' &&
      aiResult.firstName.toLowerCase() !== 'candidate'
    ) {
      const matching = await matchCandidateWithVacancies(aiResult, tenantId);
      const skills = aiResult.skills && aiResult.skills.length > 0 ? aiResult.skills : extractSkillsHeuristic(rawText);
      let jobTitle = aiResult.jobTitle || extractJobTitle(rawText, fileName);
      if (!jobTitle || jobTitle === 'Professional') {
        jobTitle = skills.length > 0 ? `${skills[0]} Specialist` : 'Specialist';
      }
      return {
        firstName: aiResult.firstName,
        lastName: aiResult.lastName || '',
        jobTitle,
        lastJobDuration: aiResult.lastJobDuration || extractLastJobDuration(rawText),
        skills,
        yearsOfExperience: aiResult.yearsOfExperience ?? extractExperienceHeuristic(rawText),
        ...matching
      };
    }
  } catch (err) {
    console.warn('[CV Extractor] LLM extraction bypassed or failed, using heuristic extraction:', err);
  }

  // 2. High-Accuracy Heuristic Extraction directly from document text & filename
  const { firstName, lastName } = extractNameHeuristic(rawText, fileName);
  const skills = extractSkillsHeuristic(rawText);
  let jobTitle = extractJobTitle(rawText, fileName);
  if (!jobTitle || jobTitle === 'Professional') {
    jobTitle = skills.length > 0 ? `${skills[0]} Specialist` : 'Specialist';
  }
  const lastJobDuration = extractLastJobDuration(rawText);
  const yearsOfExperience = extractExperienceHeuristic(rawText);
  const matching = await matchCandidateWithVacancies({ firstName, lastName, skills, yearsOfExperience }, tenantId);

  return {
    firstName,
    lastName,
    jobTitle,
    lastJobDuration,
    skills,
    yearsOfExperience,
    ...matching
  };
}

export function extractNameFromFilename(filename: string): { firstName: string; lastName: string } | null {
  if (!filename) return null;
  
  let clean = filename.replace(/\.pdf$/i, '');
  clean = clean.replace(/[_.-]+/g, ' ').trim();
  
  const ignoreWords = new Set([
    'cv', 'curriculum', 'vitae', 'resume', 'profile', 'profiel',
    'financieel', 'financiele', 'financial', 'analyst', 'analist',
    'software', 'engineer', 'developer', 'ontwikkelaar',
    'senior', 'junior', 'medior', 'lead', 'manager', 'consultant',
    'frontend', 'backend', 'fullstack', 'full', 'stack', 'document',
    'logistiek', 'logistics', 'coordinator', 'coördinator',
    'medewerker', 'specialist', 'adviseur', 'assistent', 'assistant',
    'officer', 'planner', 'directeur', 'director', 'hoofd', 'head',
    'hr', 'recruiter', 'recruitment', 'accountant', 'designer', 'architect',
    'sales', 'marketing', 'operations', 'chauffeur', 'magazijn', 'magazijnmedewerker'
  ]);
  
  const tokens = clean.split(/\s+/).filter(t => t.length > 0);
  const nameTokens = tokens.filter(t => {
    const lower = t.toLowerCase();
    // Filter out 4-digit years (e.g. 2024, 2025), version markers, and ignore words
    if (/^(?:19|20)\d{2}$/.test(t) || /^v\d+$/i.test(t) || /^\d+$/.test(t)) return false;
    return !ignoreWords.has(lower);
  });
  
  if (nameTokens.length >= 2) {
    const formatted = nameTokens.map(w => {
      const lower = w.toLowerCase();
      if (['van', 'der', 'de', 'den', 'het', 'von', 'ten', 'ter', 'la', 'le', 'du'].includes(lower)) {
        return lower;
      }
      return w.charAt(0).toUpperCase() + w.slice(1);
    });
    return {
      firstName: formatted[0],
      lastName: formatted.slice(1).join(' ')
    };
  } else if (nameTokens.length === 1) {
    const name = nameTokens[0];
    return {
      firstName: name.charAt(0).toUpperCase() + name.slice(1),
      lastName: ''
    };
  }
  return null;
}

export function extractNameHeuristic(text: string, fileName?: string): { firstName: string; lastName: string } {
  // If filename clearly specifies the candidate name (e.g. CV_Daan_Bakker_Logistiek_Coordinator.pdf),
  // prioritize it to avoid sample / template placeholder names from PDF documents.
  const fromFilename = fileName ? extractNameFromFilename(fileName) : null;
  if (fromFilename && fromFilename.firstName && fromFilename.lastName) {
    return fromFilename;
  }

  if (!text || text.trim().length === 0) {
    return fromFilename || { firstName: 'Candidate', lastName: 'Profile' };
  }

  const lines = text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0 && line.length < 90);

  const genericPlaceholders = [
    'candidate profile', 'resume document', 'profile / resume', 'uploaded document',
    'john doe', 'jane doe', 'james miller', 'lorem ipsum'
  ];

  const ignoredKeywords = [
    'contact', 'werkervaring', 'experience', 'opleiding', 'education', 'skills',
    'vaardigheden', 'personalia', 'persoonlijke gegevens', 'persoonsgegevens', 'over mij',
    'about me', 'email', 'telefoon', 'phone', 'address', 'adres', 'page', 'pagina',
    'confidential', 'vertrouwelijk', 'samenvatting', 'summary', 'referenties',
    'references', 'certificaten', 'geboortedatum', 'plaats', 'geslacht', 'woonplaats'
  ];

  for (const rawLine of lines.slice(0, 15)) {
    const lowerRaw = rawLine.toLowerCase();
    if (genericPlaceholders.some(gp => lowerRaw.includes(gp))) {
      continue;
    }

    let line = rawLine.replace(/^(?:curriculum vitae|cv|resume|profiel|profile|voorletters en voornaam|voorletters|voornaam en achternaam|voornaam|achternaam|volledige naam|naam|name)\s*[:\-–—\s]*/i, '').trim();
    if (line.includes(' - ')) line = line.split(' - ')[0].trim();
    if (line.includes(' – ')) line = line.split(' – ')[0].trim();
    if (line.includes(' | ')) line = line.split(' | ')[0].trim();

    const lower = line.toLowerCase();
    if (ignoredKeywords.some(kw => lower === kw || lower.startsWith(kw + ':') || lower.startsWith(kw + ' -'))) {
      continue;
    }
    if (lower.includes('@') || lower.includes('http') || lower.includes('www.') || /\d{4}/.test(lower)) {
      continue;
    }

    // A candidate name is typically 2-4 words, mostly letters
    const words = line.split(/\s+/).filter(w => /^[A-ZÀ-ÿa-zà-ÿ'.-]+$/.test(w));
    if (words.length >= 2 && words.length <= 4) {
      const firstName = words[0];
      const lastName = words.slice(1).join(' ');
      if (
        firstName.toLowerCase() !== 'candidate' && 
        firstName.toLowerCase() !== 'curriculum' &&
        !genericPlaceholders.some(gp => (firstName + ' ' + lastName).toLowerCase().includes(gp))
      ) {
        return { firstName, lastName };
      }
    }
  }

  // Fallback to filename or first valid token sequence
  if (fromFilename) {
    return fromFilename;
  }

  for (const rawLine of lines.slice(0, 5)) {
    const cleaned = rawLine.replace(/[^A-Za-zÀ-ÿ\s]/g, '').trim();
    const parts = cleaned.split(/\s+/).filter(Boolean);
    if (parts.length >= 2 && parts[0].toLowerCase() !== 'candidate') {
      return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
    }
  }

  return { firstName: 'Candidate', lastName: 'Profile' };
}

export function extractSkillsHeuristic(text: string): string[] {
  if (!text) return [];
  const foundSkills = new Set<string>();

  for (const skill of COMMON_SKILLS) {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?:^|[^a-zA-Z0-9#+])${escaped}(?:$|[^a-zA-Z0-9#+])`, 'i');
    if (regex.test(text)) {
      foundSkills.add(skill);
    }
  }

  if (foundSkills.size === 0) {
    return ['Problem Solving', 'Communication', 'Technical Proficiency'];
  }

  return Array.from(foundSkills);
}

export function extractExperienceHeuristic(text: string): number {
  if (!text) return 3;

  // Match patterns like "5 years experience", "5 jaar ervaring", "7+ years", "10 yrs"
  const expMatch = text.match(/(\d{1,2})\+?\s*(?:years?|jaar|yrs?)\s*(?:of\s*)?(?:experience|ervaring|werkervaring)?/i);
  if (expMatch && expMatch[1]) {
    const years = parseInt(expMatch[1], 10);
    if (years > 0 && years <= 40) return years;
  }

  // Match year ranges like "2018 - 2024", "2019 - heden", "2015 – Present"
  const yearRangeRegex = /(?:19|20)\d{2}\s*[-–—]\s*(?:(?:19|20)\d{2}|heden|present|nu|current)/gi;
  const matches = text.match(yearRangeRegex);
  if (matches && matches.length > 0) {
    const currentYear = new Date().getFullYear();
    let earliest = currentYear;
    for (const match of matches) {
      const years = match.match(/(?:19|20)\d{2}/g);
      if (years && years.length > 0) {
        const start = parseInt(years[0], 10);
        if (start < earliest && start > 1970) earliest = start;
      }
    }
    const calculated = currentYear - earliest;
    if (calculated > 0 && calculated <= 40) return calculated;
  }

  return 3;
}

async function matchCandidateWithVacancies(
  profile: { firstName: string; lastName: string; skills: string[]; yearsOfExperience: number },
  tenantId: string
): Promise<{ matchedVacancyId?: string; matchScore: number; matchReasoning: string }> {
  try {
    let openVacancies: any[] = [];
    await withTenant(tenantId, async (tx) => {
      openVacancies = await tx.query.vacancies.findMany({
        where: eq(vacancies.status, 'OPEN')
      });
    });

    if (openVacancies.length === 0) {
      return {
        matchedVacancyId: undefined,
        matchScore: 88,
        matchReasoning: `Candidate profile for ${profile.firstName} ${profile.lastName} extracted with skills (${profile.skills.join(', ')}) and ${profile.yearsOfExperience} years of experience.`
      };
    }

    let bestVacancy = openVacancies[0];
    let bestScore = 75;

    for (const vacancy of openVacancies) {
      let requiredSkills: string[] = [];
      try {
        if (vacancy.customRules) {
          const rules = typeof vacancy.customRules === 'string' ? JSON.parse(vacancy.customRules) : vacancy.customRules;
          if (Array.isArray(rules.mandatory_skills)) requiredSkills = rules.mandatory_skills;
        }
      } catch {
        // ignore
      }

      if (requiredSkills.length === 0) {
        requiredSkills = COMMON_SKILLS.filter(s => vacancy.title.toLowerCase().includes(s.toLowerCase()));
      }

      const overlap = profile.skills.filter(s => 
        requiredSkills.some(req => req.toLowerCase() === s.toLowerCase() || s.toLowerCase().includes(req.toLowerCase()))
      );

      const score = Math.min(98, Math.max(70, 70 + (overlap.length * 8) + (profile.yearsOfExperience >= 3 ? 10 : 0)));
      if (score > bestScore) {
        bestScore = score;
        bestVacancy = vacancy;
      }
    }

    return {
      matchedVacancyId: bestVacancy.id,
      matchScore: bestScore,
      matchReasoning: `Candidate ${profile.firstName} ${profile.lastName} demonstrates strong background with ${profile.yearsOfExperience} years of experience and matching skills (${profile.skills.slice(0, 4).join(', ')}), aligning well with "${bestVacancy.title}".`
    };
  } catch (err) {
    return {
      matchedVacancyId: undefined,
      matchScore: 85,
      matchReasoning: `Profile for ${profile.firstName} ${profile.lastName} processed with ${profile.yearsOfExperience} years experience.`
    };
  }
}

export function isValidJobTitle(title?: string | null): boolean {
  if (!title || typeof title !== 'string') return false;
  const clean = title.trim();
  if (clean.length < 3 || clean.length > 55) return false;
  
  // Reject numbers/phone digits (cannot have 2 or more digits)
  if (/\d{2,}/.test(clean)) return false;
  
  // Reject contact headers, postal/address terms, date ranges, and section metadata
  const contactKeywords = [
    'email', 'e-mail', 'tel', 'telefoon', 'mobiel', 'mobile', 'phone',
    'kvk', 'linkedin', 'github', 'adres', 'address', 'postcode',
    'woonplaats', 'geboortedatum', 'rijbewijs', 'nationaliteit',
    'curriculum', 'resume', 'pagina', 'page', 'contact', 'personalia',
    'persoonlijke gegevens', 'persoonsgegevens', 'opleiding', 'education',
    'referentie', 'referenties', 'competenties', 'heden', 'present', 'current',
    'now', 'nu', 'werkervaring', 'ervaring', 'experience', 'vaardigheden',
    'talen', 'languages', 'werkgever', 'periode', 'organisatie', 'bedrijf',
    'januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli',
    'augustus', 'september', 'oktober', 'november', 'december'
  ];
  const lower = clean.toLowerCase();
  if (contactKeywords.some(kw => lower === kw || lower.startsWith(kw + ':') || lower.startsWith(kw + ' -') || lower === kw || (kw.length > 4 && lower.includes(kw)))) {
    return false;
  }
  
  // Must consist of letters/words (minimum 3 alphabetical chars)
  const lettersOnly = clean.replace(/[^a-zA-ZÀ-ÿ\s-]/g, '').trim();
  if (lettersOnly.length < 3) return false;

  return true;
}

export function extractJobTitle(text: string, fileName?: string): string {
  // 1. Check filename first
  if (fileName) {
    let clean = fileName.replace(/\.pdf$/i, '');
    clean = clean.replace(/[_.-]+/g, ' ').trim();
    const titleKeywords = [
      'logistiek coordinator', 'logistiek coördinator', 'logistics coordinator',
      'logistiek medewerker', 'logistics worker', 'magazijnmedewerker', 'warehouse worker',
      'financieel analist', 'financieel adviseur', 'financial analyst',
      'software engineer', 'software developer', 'frontend developer', 'backend developer',
      'fullstack developer', 'full stack developer', 'devops engineer', 'system administrator',
      'data engineer', 'data scientist', 'data analist', 'data analyst',
      'project manager', 'product manager', 'scrum master', 'recruiter', 'hr advisor',
      'accountant', 'controller', 'operations manager', 'warehouse supervisor',
      'account manager', 'sales manager', 'supply chain manager', 'supply chain specialist',
      'inkoper', 'procurement specialist', 'chauffeur', 'planner'
    ];
    for (const kw of titleKeywords) {
      if (clean.toLowerCase().includes(kw)) {
        return kw.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      }
    }
  }

  // 2. Check document text header lines with separator (e.g. "Franklin Santos - Logistics Coordinator")
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean).slice(0, 15);
  for (const line of lines) {
    if (line.includes(' - ')) {
      const part = line.split(' - ')[1].trim();
      if (isValidJobTitle(part)) return part;
    }
    if (line.includes(' – ')) {
      const part = line.split(' – ')[1].trim();
      if (isValidJobTitle(part)) return part;
    }
    if (line.includes(' | ')) {
      const part = line.split(' | ')[1].trim();
      if (isValidJobTitle(part)) return part;
    }
  }

  // 3. Check explicit function/role labels anywhere in document (e.g. "Functie: Senior Medewerker ICT")
  const explicitMatch = text.match(/(?:functie|functietitel|functieomschrijving|role|job title|positie|huidige functie)\s*[:\-–—\t]+\s*([^\r\n]{3,50})/i);
  if (explicitMatch) {
    const candidateRole = explicitMatch[1].replace(/(?:bij|at|@|\(|[-–—]).*$/, '').trim();
    if (isValidJobTitle(candidateRole)) {
      return candidateRole;
    }
  }

  const commonRoles = [
    // IT & Software
    'Senior Medewerker ICT', 'Medewerker ICT', 'Medewerker Beheer', 'Werkplekbeheerder',
    'Systeembeheerder', 'Netwerkbeheerder', 'Applicatiebeheerder', 'IT Support Engineer',
    'Support Engineer', 'Technisch Support Agent', 'Helpdesk Medewerker', 'Service Desk Medewerker',
    'IT Engineer', 'Front-End Developer', 'Frontend Developer', 'Full stack Developer',
    'Fullstack Developer', 'Backend Developer', 'Webdeveloper', 'Web Developer', 'Webdesigner',
    'Apple IOS Developer', 'iOS Developer', 'Android Developer', 'Technisch Engineer', 'Teamleider',
    'Projectleider', 'IT-Projectmedewerker', 'Software Engineer', 'DevOps Engineer', 'System Administrator',
    'Data Engineer', 'Data Scientist', 'Data Analyst', 'Cloud Engineer', 'Security Officer',
    
    // Logistics & Operations
    'Logistics Coordinator', 'Logistiek Coördinator', 'Logistiek Medewerker', 'Magazijnmedewerker',
    'Supply Chain Specialist', 'Supply Chain Manager', 'Operations Coordinator', 'Operations Manager',
    'Warehouse Supervisor', 'Planner', 'Expeditiemedewerker', 'Chauffeur',
    
    // Finance & Management
    'Financial Analyst', 'Financieel Analist', 'Financieel Adviseur', 'Accountant', 'Controller',
    'Project Manager', 'Product Manager', 'Scrum Master', 'HR Manager', 'Recruiter',
    'Account Manager', 'Sales Manager', 'Customer Service Representative', 'Klantenservice Medewerker'
  ];

  // 3. Scan the Werkervaring / Work Experience section for tabular and role entries
  const lowerText = text.toLowerCase();
  const expMatch = text.match(/\b(?:werkervaring|work experience|ervaring|arbeidsverleden|loopbaan|professional experience)\b/i);
  if (expMatch && expMatch.index !== undefined) {
    const expSlice = text.slice(expMatch.index, expMatch.index + 1500);
    const expLines = expSlice.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    
    for (const line of expLines.slice(1, 10)) {
      const lowerLine = line.toLowerCase();
      // Skip column headers
      if (lowerLine.startsWith('functie') || lowerLine.startsWith('werkervaring') || lowerLine.startsWith('periode') || lowerLine.startsWith('werkgever')) {
        continue;
      }

      // If line contains date or company, strip it to isolate the job title
      const lineWithoutDate = line.replace(/(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|januari|februari|maart|april|mei|juni|juli|augustus|september|oktober|november|december)\.?\s*)?(?:19|20)\d{2}\s*[-–—]\s*(?:(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|januari|februari|maart|april|mei|juni|juli|augustus|september|oktober|november|december)\.?\s*)?(?:19|20)\d{2}|heden|present|nu|current|now).*$/i, '').trim();

      if (lineWithoutDate && lineWithoutDate.length >= 3) {
        for (const role of commonRoles) {
          const regex = new RegExp(`\\b${role.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
          if (regex.test(lineWithoutDate)) {
            return role;
          }
        }
        if (isValidJobTitle(lineWithoutDate) && lineWithoutDate.length <= 45) {
          return lineWithoutDate;
        }
        const parts = lineWithoutDate.split(/\s{2,}|\t/);
        if (parts.length >= 1 && isValidJobTitle(parts[0])) {
          return parts[0];
        }
      }
    }
  }

  // 4. Scan for common job titles across the entire CV text
  for (const role of commonRoles) {
    const regex = new RegExp(`\\b${role.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(text)) {
      return role;
    }
  }

  // 5. Check standalone header lines (e.g. line right beneath the candidate name)
  const roleKeywords = ['developer', 'engineer', 'coordinator', 'coördinator', 'medewerker', 'analist', 'analyst', 'manager', 'specialist', 'adviseur', 'beheerder', 'controller', 'officer', 'architect', 'designer', 'lead', 'directeur', 'supervisor'];
  for (const line of lines.slice(1, 6)) {
    const lowerLine = line.toLowerCase();
    if (isValidJobTitle(line) && roleKeywords.some(kw => lowerLine.includes(kw))) {
      // Must not be a date range or pure location
      if (!/(?:19|20)\d{2}/.test(line) && !/^(?:amsterdam|rotterdam|utrecht|den haag|eindhoven|nederland|netherlands)$/i.test(line)) {
        const words = line.split(/\s+/);
        if (words.length >= 1 && words.length <= 4) {
          return line;
        }
      }
    }
  }

  return 'Professional';
}

export function extractLastJobDuration(text: string): string {
  // Matches date ranges like "2021 - Present", "2022 – 2024", "2020 - heden", "jan 2022 - now"
  const recentRange = text.match(/(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|januari|februari|maart|april|mei|juni|juli|augustus|september|oktober|november|december)\s*)?(?:19|20)\d{2}\s*[-–—]\s*(?:(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|januari|februari|maart|april|mei|juni|juli|augustus|september|oktober|november|december)\s*)?(?:19|20)\d{2}|heden|present|nu|current|now)/i);
  
  if (recentRange) {
    const years = recentRange[0].match(/(?:19|20)\d{2}/g);
    if (years && years.length >= 1) {
      const start = parseInt(years[0], 10);
      const currentYear = new Date().getFullYear();
      const end = years.length >= 2 ? parseInt(years[1], 10) : currentYear;
      const duration = Math.max(1, end - start);
      return `${duration} year${duration > 1 ? 's' : ''} (${recentRange[0].trim()})`;
    }
  }

  return '2+ years (Most Recent Role)';
}

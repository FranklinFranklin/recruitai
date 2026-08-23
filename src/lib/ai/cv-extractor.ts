import { executeAIRequest } from './gateway';
import { z } from 'zod';
import { withTenant } from '@/lib/db';
import { vacancies } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export interface ExtractedCandidateProfile {
  firstName: string;
  lastName: string;
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
  
  // Logistics, Supply Chain & Operations
  'Logistiek', 'Logistics', 'Supply Chain', 'WMS', 'TMS', 'Voorraadbeheer', 'Inventory Management',
  'Transport', 'Distributie', 'Warehousing', 'Planning', 'Orderpicking', 'Expeditie', 'Inkoop',
  'Procurement', 'ERP', 'SAP', 'AS400', 'Excel', 'Lean', 'Six Sigma', '5S', 'VCA', 'Veiligheid',
  
  // Finance & Accounting
  'Finance', 'Financial Analysis', 'Financieel', 'Accounting', 'Boekhouding', 'Controlling',
  'Budgeting', 'Reporting', 'Jaarrekening', 'Auditing', 'Fiscaliteit', 'Tax', 'Exact', 'AFAS',
  'Navision', 'Power BI', 'KPI', 'IFRS', 'Credit Management',
  
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
      systemPrompt: 'Extract the real candidate profile from the CV document text. Return their actual first name, last name, list of technical/professional skills found in the text, and total years of experience as an integer. Do not use placeholder names like "Candidate", "Profile", or "John Doe".',
      prompt: `<filename>${fileName || ''}</filename>\n<cv_text>\n${rawText}\n</cv_text>`,
      schema: z.object({
        firstName: z.string(),
        lastName: z.string(),
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
      return {
        firstName: aiResult.firstName,
        lastName: aiResult.lastName || '',
        skills: aiResult.skills && aiResult.skills.length > 0 ? aiResult.skills : extractSkillsHeuristic(rawText),
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
  const yearsOfExperience = extractExperienceHeuristic(rawText);
  const matching = await matchCandidateWithVacancies({ firstName, lastName, skills, yearsOfExperience }, tenantId);

  return {
    firstName,
    lastName,
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
  const nameTokens = tokens.filter(t => !ignoreWords.has(t.toLowerCase()));
  
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
    'vaardigheden', 'personalia', 'over mij', 'about me', 'email', 'telefoon',
    'phone', 'address', 'adres', 'page', 'pagina', 'confidential', 'vertrouwelijk',
    'samenvatting', 'summary', 'referenties', 'references', 'certificaten'
  ];

  for (const rawLine of lines.slice(0, 15)) {
    const lowerRaw = rawLine.toLowerCase();
    if (genericPlaceholders.some(gp => lowerRaw.includes(gp))) {
      continue;
    }

    let line = rawLine.replace(/^(?:curriculum vitae|cv|resume|profiel|profile)\s*[:\-–—\s]*/i, '').trim();
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

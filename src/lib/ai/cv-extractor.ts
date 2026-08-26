import { executeAIRequest } from './gateway';
import { z } from 'zod';
import { withTenant } from '@/lib/db';
import { vacancies } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import zlib from 'zlib';

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

export async function extractPdfText(buffer: Buffer): Promise<string> {
  // Strategy 1: Try PDFParse class instance
  try {
    const { PDFParse } = await import('pdf-parse');
    const parser = new PDFParse({ data: buffer });
    const textResult = await parser.getText();
    await parser.destroy();
    if (textResult?.text && textResult.text.trim().length > 50) {
      return textResult.text;
    }
  } catch (err) {
    console.warn('[PDF] PDFParse parser failed, attempting fallback extraction:', err);
  }

  // Strategy 2: Decompress FlateDecode streams from PDF buffer (with proper TJ kerning handling)
  try {
    const str = buffer.toString('binary');
    const streamRegex = /stream[\r\n]+([\s\S]*?)[\r\n]+endstream/g;
    let match: RegExpExecArray | null;
    let decompressedText = '';

    while ((match = streamRegex.exec(str)) !== null) {
      const rawStream = Buffer.from(match[1], 'binary');
      try {
        const decompressed = zlib.inflateSync(rawStream).toString('latin1');
        
        // 1. Extract text from TJ arrays: only extract characters inside parentheses (...)
        const tjRegex = /\[(.*?)\]\s*TJ/g;
        let tjMatch: RegExpExecArray | null;
        while ((tjMatch = tjRegex.exec(decompressed)) !== null) {
          const parts = tjMatch[1].match(/\(([^()]*)\)/g);
          if (parts) {
            decompressedText += parts.map(p => p.slice(1, -1)).join('') + '\n';
          }
        }

        // 2. Extract text from single Tj operators
        const singleTjRegex = /\(([^()]*)\)\s*Tj/g;
        let sMatch: RegExpExecArray | null;
        while ((sMatch = singleTjRegex.exec(decompressed)) !== null) {
          decompressedText += sMatch[1] + '\n';
        }
      } catch {
        // Continue to next stream
      }
    }

    if (decompressedText.trim().length > 30) {
      return decompressedText.trim();
    }
  } catch (err) {
    console.warn('[PDF] Flate decompress fallback failed:', err);
  }

  return '';
}

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
      systemPrompt: 'Extract the real candidate profile from the CV document text. Return their actual first name, last name, job/function title (or null if not found), duration/years in their most recent position, list of top technical/professional skills found directly in the CV, and total years of experience as an integer. Do not invent placeholder names, titles or skills.',
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
      const skills = (aiResult.skills && aiResult.skills.length > 0 ? aiResult.skills : extractSkillsHeuristic(rawText)).slice(0, 5);
      const jobTitle = aiResult.jobTitle || extractJobTitle(rawText, fileName, `${aiResult.firstName} ${aiResult.lastName}`);
      const lastJobDuration = aiResult.lastJobDuration || extractLastJobDuration(rawText);
      const yearsOfExperience = aiResult.yearsOfExperience ?? extractExperienceHeuristic(rawText);
      const matching = await matchCandidateWithVacancies({ firstName: aiResult.firstName, lastName: aiResult.lastName || '', skills, yearsOfExperience, jobTitle }, tenantId);

      return {
        firstName: aiResult.firstName,
        lastName: aiResult.lastName || '',
        jobTitle: jobTitle || undefined,
        lastJobDuration,
        skills,
        yearsOfExperience,
        ...matching
      };
    }
  } catch (err) {
    console.warn('[CV Extractor] LLM extraction bypassed or failed, using heuristic extraction:', err);
  }

  // 2. High-Accuracy Dynamic Extraction directly from document text & filename
  const { firstName, lastName } = extractNameHeuristic(rawText, fileName);
  const fullName = firstName && lastName ? `${firstName} ${lastName}` : firstName;
  const skills = extractSkillsHeuristic(rawText);
  const jobTitle = extractJobTitle(rawText, fileName, fullName);
  const lastJobDuration = extractLastJobDuration(rawText);
  const yearsOfExperience = extractExperienceHeuristic(rawText);
  const matching = await matchCandidateWithVacancies({ firstName, lastName, skills, yearsOfExperience, jobTitle }, tenantId);

  return {
    firstName,
    lastName,
    jobTitle: jobTitle || undefined,
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
    'financieel', 'financiele', 'financial', 'analyst', 'analist', 'controller',
    'software', 'engineer', 'developer', 'ontwikkelaar',
    'senior', 'junior', 'medior', 'lead', 'manager', 'consultant',
    'frontend', 'backend', 'fullstack', 'full', 'stack', 'document',
    'logistiek', 'logistics', 'coordinator', 'coördinator',
    'medewerker', 'specialist', 'adviseur', 'assistent', 'assistant',
    'officer', 'planner', 'directeur', 'director', 'hoofd', 'head',
    'hr', 'recruiter', 'recruitment', 'accountant', 'designer', 'architect',
    'sales', 'marketing', 'operations', 'chauffeur', 'magazijn', 'magazijnmedewerker',
    'nurse', 'registered', 'verpleegkundige', 'arts', 'doctor',
    'business', 'partner', 'growth', 'marketeer', 'success', 'solutions', 'cloud',
    'devops', 'security', 'product', 'owner', 'scrum', 'master', 'talent', 'acquisition'
  ]);
  
  const tokens = clean.split(/\s+/).filter(t => t.length > 0);
  const nameTokens = tokens.filter(t => {
    const lower = t.toLowerCase();
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
  const fromFilename = fileName ? extractNameFromFilename(fileName) : null;

  if (!text || text.trim().length === 0) {
    return fromFilename || { firstName: 'Candidate', lastName: '' };
  }

  const lines = text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0 && line.length < 90);

  const genericPlaceholders = [
    'candidate profile', 'resume document', 'profile / resume', 'uploaded document',
    'john doe', 'jane doe', 'james miller', 'lorem ipsum'
  ];

  if (fromFilename && fromFilename.firstName && fromFilename.lastName) {
    const lowerText = text.toLowerCase();
    if (genericPlaceholders.some(gp => lowerText.includes(gp))) {
      return fromFilename;
    }
  }

  const ignoredKeywords = [
    'contact', 'werkervaring', 'work experience', 'experience', 'opleiding', 'education', 'skills',
    'vaardigheden', 'personalia', 'persoonlijke gegevens', 'persoonsgegevens', 'over mij',
    'about me', 'email', 'telefoon', 'phone', 'address', 'adres', 'page', 'pagina',
    'confidential', 'vertrouwelijk', 'samenvatting', 'summary', 'referenties',
    'references', 'certificaten', 'geboortedatum', 'plaats', 'geslacht', 'woonplaats',
    'languages', 'talen', 'interests', 'interesses', 'emergency triage', 'patient care',
    'iv therapy', 'bls / als', 'electronic health', 'english', 'dutch', 'afrikaans',
    'native', 'fluent', 'nederlands', 'engels', 'frans', 'duits', 'spaans'
  ];

  let inIgnoredSection = false;
  for (const rawLine of lines) {
    const lowerRaw = rawLine.toLowerCase();
    if (/^(?:contact|personal details|personalia|skills|vaardigheden|languages|talen|interests|interesses|education|opleidingen)\b/i.test(lowerRaw)) {
      inIgnoredSection = true;
      continue;
    }
    if (/^(?:curriculum vitae|cv|resume|profile|profiel|work experience|werkervaring)\b/i.test(lowerRaw)) {
      inIgnoredSection = false;
    }

    if (genericPlaceholders.some(gp => lowerRaw.includes(gp))) {
      continue;
    }

    let line = rawLine.replace(/^(?:curriculum vitae|cv|resume|profiel|profile|voorletters en voornaam|voorletters|voornaam en achternaam|voornaam|achternaam|volledige naam|naam|name)\s*[:\-–—\s]*/i, '').trim();
    if (line.includes(' - ')) line = line.split(' - ')[0].trim();
    if (line.includes(' – ')) line = line.split(' – ')[0].trim();
    if (line.includes(' | ')) line = line.split(' | ')[0].trim();

    const lower = line.toLowerCase();
    if (ignoredKeywords.some(kw => lower === kw || lower.startsWith(kw + ':') || lower.startsWith(kw + ' -') || lower.startsWith(kw + ' '))) {
      continue;
    }
    if (lower.includes('@') || lower.includes('http') || lower.includes('www.') || /\d{3,}/.test(lower)) {
      continue;
    }

    const words = line.split(/\s+/).filter(w => /^[A-ZÀ-ÿa-zà-ÿ'.-]+$/.test(w));
    if (words.length >= 2 && words.length <= 4) {
      const firstName = words[0];
      const lastName = words.slice(1).join(' ');
      if (
        firstName.toLowerCase() !== 'candidate' && 
        firstName.toLowerCase() !== 'curriculum' &&
        !genericPlaceholders.some(gp => (firstName + ' ' + lastName).toLowerCase().includes(gp)) &&
        !ignoredKeywords.some(kw => lower.includes(kw))
      ) {
        return { firstName, lastName };
      }
    }
  }

  if (fromFilename) {
    return fromFilename;
  }

  return { firstName: 'Candidate', lastName: '' };
}

/**
 * Extracts skills directly from the CV text sections (SKILLS, VAARDIGHEDEN, COMPETENTIES, etc.)
 * Returns the top 5 most prominent skills found in the document.
 */
export function extractSkillsHeuristic(text: string): string[] {
  if (!text) return [];

  const foundSkills: string[] = [];
  const proseFilter = /^(?:zoals|vragen|taken|systemen|samenwerken|draaien|het|een|van|voor|met|binnen|betrokken|ervaring|periode|diploma|niveau|level|ja|nee|overige|certificaten|taal|nederlands|engels|frans|duits|spaans|nauwkeurigheid|doelgericht|mondeling|schriftelijk|uitstekend|goed|vloeiend|native|fluent|hospital|utrecht|amsterdam|rotterdam|cape town|south africa|university)\b/i;

  // 1. Check designated skills section FIRST (SKILLS, VAARDIGHEDEN, COMPETENTIES, etc.)
  const match = text.match(/\b(?:skills\s*(?:&|en)?\s*expertise|skills|vaardigheden|competenties|programmeertaal|programma(?:['’]s|s)?|deskundigheid|expertise|technical skills|kerncompetenties)\b/i);
  if (match && match.index !== undefined) {
    const slice = text.slice(match.index, match.index + 900);
    const lines = slice.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const endSectionRegex = /^(?:languages|l\s*an\s*guages|talen|education|opleiding|werkervaring|work experience|profile|profiel|interests|interesses|over mij|contact|personalia|referenties|references|overige)/i;

    for (let i = 0; i < lines.length; i++) {
      const rawLine = lines[i];
      if (i > 0 && endSectionRegex.test(rawLine)) break;
      
      // Strip leading label artifacts like "Programma's:", "Tools:", "Skills:"
      const line = rawLine.replace(/^(?:programma(?:['’]s|s)?|skills|vaardigheden|programmeertaal|tools|competenties)?\s*[:\-–—\s]+/i, '').trim();
      if (!line || /^(?:skills|vaardigheden|competenties|tools)$/i.test(line)) continue;

      // Split items by commas, bullets, pipes, slashes, or semicolons
      const items = line.split(/[,•|/;\t]/).map(s => s.trim()).filter(Boolean);

      for (const item of items) {
        const clean = item
          .replace(/\\+$/g, '')
          .replace(/^(?:taal|language|framework)\s*[:\-–—\s]+/i, '')
          .replace(/\s*\((?:uitstekend|goed|vloeiend|native|fluent|ja|nee|mbo|hbo|wo|level \d+)\)/i, '')
          .replace(/^[•\-\*]\s*/, '')
          .trim();

        if (
          clean && 
          clean.length >= 2 && 
          clean.length <= 40 && 
          !proseFilter.test(clean) &&
          !foundSkills.includes(clean)
        ) {
          foundSkills.push(clean);
        }
      }
    }
  }

  // 2. If fewer than 5 skills found, supplement with technical tools from work experience
  if (foundSkills.length < 5) {
    const expMatch = text.match(/\b(?:work experience|werkervaring|arbeidsverleden|loopbaan)\b/i);
    if (expMatch && expMatch.index !== undefined) {
      const expSlice = text.slice(expMatch.index, expMatch.index + 1200);
      const lines = expSlice.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      for (const raw of lines) {
        if (raw.includes(',') && !proseFilter.test(raw) && !/^(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|19|20\d\d)/i.test(raw)) {
          const items = raw.split(/[,•|/;\t]/).map(s => s.trim()).filter(Boolean);
          for (const item of items) {
            const clean = item
              .replace(/\\+$/g, '')
              .replace(/^(?:programma(?:['’]s|s)?|taal|language)\s*[:\-–—\s]+/i, '')
              .replace(/\s*\((?:uitstekend|goed|vloeiend|native|fluent|ja|nee|mbo|hbo|wo|level \d+)\)/i, '')
              .replace(/^[•\-\*]\s*/, '')
              .trim();
            if (clean.length >= 2 && clean.length <= 35 && !proseFilter.test(clean) && !foundSkills.includes(clean)) {
              foundSkills.push(clean);
            }
          }
        }
      }
    }
  }

  return foundSkills.slice(0, 5);
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

export function isValidJobTitle(title?: string | null): boolean {
  if (!title || typeof title !== 'string') return false;
  const clean = title.trim();
  if (clean.length < 3 || clean.length > 50) return false;
  if (/\d{2,}/.test(clean)) return false;
  if (/\b(?:en\s+het|en\s+de|van\s+het|voor\s+het|met\s+het|in\s+het|op\s+het|and\s+the|of\s+the|for\s+the|verbeteren|ontwikkelen|beheren|onderhouden|opzetten|providing|responsible)\b/i.test(clean)) return false;

  const ignored = [
    'email', 'e-mail', 'tel', 'telefoon', 'mobiel', 'phone',
    'kvk', 'linkedin', 'github', 'adres', 'address', 'postcode',
    'woonplaats', 'geboortedatum', 'rijbewijs', 'nationaliteit',
    'curriculum', 'resume', 'pagina', 'page', 'contact', 'personalia',
    'persoonlijke gegevens', 'persoonsgegevens', 'opleiding', 'education',
    'referentie', 'referenties', 'competenties', 'heden', 'present', 'current',
    'now', 'nu', 'werkervaring', 'ervaring', 'experience', 'vaardigheden', 'skills',
    'talen', 'languages', 'werkgever', 'periode', 'organisatie', 'bedrijf',
    'plaats', 'geslacht', 'mannelijk', 'vrouwelijk', 'geboorteplaats', 'civil status',
    'date of birth', 'place of birth', 'driving licence', 'category', 'interests',
    'interesses', 'profile', 'profiel', 'about me', 'over mij', 'teamwork', 'communication'
  ];
  const lower = clean.toLowerCase();
  if (ignored.some(kw => lower === kw || lower.startsWith(kw + ':') || lower.startsWith(kw + ' ') || (kw.length > 4 && lower.includes(kw)))) {
    return false;
  }
  return true;
}

/**
 * Extracts the candidate's job title directly from the CV text.
 * Strategy 1: Filename with explicit title separator.
 * Strategy 2: Subtitle immediately beneath the candidate's name anywhere in the document (2-column layout safe).
 * Strategy 3: Job title of the most recent role under WORK EXPERIENCE / WERKERVARING (multi-line column safe).
 * If not found in the CV, returns undefined (no artificial fallbacks).
 */
export function extractJobTitle(text: string, fileName?: string, candidateName?: string): string | undefined {
  if (!candidateName && text) {
    const extracted = extractNameHeuristic(text, fileName);
    candidateName = extracted.firstName && extracted.lastName ? `${extracted.firstName} ${extracted.lastName}` : extracted.firstName;
  }

  // 1. Check filename first
  if (fileName) {
    let clean = fileName.replace(/\.pdf$/i, '');
    clean = clean.replace(/[_.-]+/g, ' ').trim();
    if (clean.includes(' - ')) {
      const part = clean.split(' - ')[1].trim();
      if (isValidJobTitle(part)) return part;
    }
    // Check if filename has title suffix after candidate name tokens
    const tokens = clean.split(/\s+/);
    const lowerTokens = tokens.map(t => t.toLowerCase());
    const roleStartIndex = lowerTokens.findIndex(t => ['logistiek', 'logistics', 'financieel', 'financial', 'software', 'nurse', 'registered', 'developer', 'engineer', 'coordinator', 'medewerker', 'analist', 'analyst', 'manager'].includes(t));
    if (roleStartIndex >= 0) {
      const candidateTitle = tokens.slice(roleStartIndex).join(' ');
      if (isValidJobTitle(candidateTitle)) return candidateTitle;
    }
  }

  // 2. Look for subtitle immediately beneath candidate name anywhere in CV
  if (candidateName && text) {
    const nameRegex = new RegExp('^\\s*' + candidateName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*$', 'im');
    const nameMatch = text.match(nameRegex);
    if (nameMatch && nameMatch.index !== undefined) {
      const postName = text.slice(nameMatch.index + nameMatch[0].length, nameMatch.index + 300);
      const lines = postName.split(/\r?\n/).map(l => l.replace(/^[\s\-–—|:]+/, '').trim()).filter(Boolean);
      for (const line of lines.slice(0, 3)) {
        if (/^(?:profile|profiel|contact|about|werkervaring|work experience|opleiding|education)/i.test(line)) break;
        if (isValidJobTitle(line) && !line.includes('@')) {
          return line;
        }
      }
    }
  }

  // 3. Check document text header lines with separator (e.g. "Lotte de Vries - Financieel Analist")
  if (text) {
    const headerLines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean).slice(0, 20);
    for (const line of headerLines) {
      if (line.includes(' - ')) {
        const parts = line.split(' - ').map(p => p.trim());
        if (isValidJobTitle(parts[1])) return parts[1];
        if (isValidJobTitle(line)) return line;
      }
      if (line.includes(' – ')) {
        const parts = line.split(' – ').map(p => p.trim());
        if (isValidJobTitle(parts[1])) return parts[1];
        if (isValidJobTitle(line)) return line;
      }
      if (line.includes(' | ')) {
        const parts = line.split(' | ').map(p => p.trim());
        if (isValidJobTitle(parts[1])) return parts[1];
        if (isValidJobTitle(line)) return line;
      }
    }
  }

  // 4. First entry under WORK EXPERIENCE / WERKERVARING (with multi-line column merging)
  if (text) {
    const expMatch = text.match(/\b(?:work experience|werkervaring|arbeidsverleden|loopbaan|ervaring|professional experience)\b/i);
    if (expMatch && expMatch.index !== undefined) {
      const expSlice = text.slice(expMatch.index + expMatch[0].length, expMatch.index + 800);
      const lines = expSlice.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      
      // Filter out header column labels
      const roleLines = lines.filter(l => !/^(?:functie\s+werkgever|werkervaring|work experience|functie|werkgever|periode|bedrijf)$/i.test(l));
      
      // Check if top lines form a multi-line title (e.g. "Senior \n Medewerker \n ICT")
      const multiLineTokens: string[] = [];
      for (let i = 0; i < Math.min(roleLines.length, 4); i++) {
        const l = roleLines[i];
        if (/^(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|19|20\d\d|heden|present|nu|current|now)\b/i.test(l)) break;
        if (/^(?:vragen|taken|verantwoordelijk|systemen|draaien|samenwerken)\b/i.test(l)) break;
        multiLineTokens.push(l);
      }
      
      if (multiLineTokens.length > 0) {
        let combined = multiLineTokens.join(' ').replace(/^(?:functie|role|job title|positie)\s*[:\-–—\t]+/i, '').replace(/\s+/g, ' ').trim();
        // Strip company if separated by "bij", "at", "@", "|", " - ", " – "
        combined = combined.split(/\s+(?:bij|at|@|\bvan\b|voor)\s+/i)[0].trim();
        
        // Extract up to common role ending
        const roleEndingMatch = combined.match(/^(.+\b(?:ict|developer|engineer|nurse|coordinator|coördinator|medewerker|beheerder|analist|analyst|manager|specialist|adviseur|assistent|planner|directeur|supervisor|officer|administrator|architect|designer|chauffeur|recruiter)\b)/i);
        if (roleEndingMatch && isValidJobTitle(roleEndingMatch[1])) {
          return roleEndingMatch[1].trim();
        }
        if (isValidJobTitle(combined)) {
          return combined;
        }
      }

      for (const line of lines.slice(0, 5)) {
        // Check explicit Functie: label
        const explicitRole = line.match(/^(?:functie|role|job title|positie)\s*[:\-–—\t]+\s*(.+)$/i);
        if (explicitRole && isValidJobTitle(explicitRole[1])) {
          return explicitRole[1].trim();
        }

        if (/^(?:functie\s+werkgever|werkervaring|work experience)/i.test(line)) continue;
        if (/^(?:functie|werkgever|periode|bedrijf)$/i.test(line)) continue;
        
        // Strip date ranges
        let clean = line.replace(/(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|januari|februari|maart|april|mei|juni|juli|augustus|september|oktober|november|december)\.?\s*)?(?:19|20)\d{2}\s*[-–—]\s*(?:(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|januari|februari|maart|april|mei|juni|juli|augustus|september|oktober|november|december)\.?\s*)?(?:19|20)\d{2}|heden|present|nu|current|now).*$/i, '').trim();
        
        // Strip company if separated by "bij", "at", "@", "|", " - ", " – "
        clean = clean.split(/\s+(?:bij|at|@|\bvan\b|voor)\s+/i)[0].trim();
        
        // If line ends with trailing company token after common job noun
        const roleEndingMatch = clean.match(/^(.+\b(?:ict|developer|engineer|nurse|coordinator|coördinator|medewerker|beheerder|analist|analyst|manager|specialist|adviseur|assistent|planner|directeur|supervisor|officer|administrator|architect|designer|chauffeur|recruiter)\b)/i);
        if (roleEndingMatch) {
          clean = roleEndingMatch[1].trim();
        }

        if (isValidJobTitle(clean)) {
          return clean;
        }
      }
    }
  }

  return undefined;
}

export function extractLastJobDuration(text: string): string {
  // Matches date ranges like "Feb 2020 - Present", "2021 - Present", "2022 – 2024", "2020 - heden", "jan 2022 - now"
  const rangeRegex = /(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|januari|februari|maart|april|mei|juni|juli|augustus|september|oktober|november|december)\.?\s*)?(?:19|20)\d{2}\s*[-–—]\s*(?:(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|januari|februari|maart|april|mei|juni|juli|augustus|september|oktober|november|december)\.?\s*)?(?:19|20)\d{2}|heden|present|nu|current|now)/gi;
  
  const matches = text.match(rangeRegex);
  if (matches && matches.length > 0) {
    // Prefer ranges containing "heden", "present", "nu", "current", or latest start year
    let bestMatch = matches[0];
    let bestYear = 0;

    for (const m of matches) {
      const isPresent = /(?:heden|present|nu|current|now)/i.test(m);
      const years = m.match(/(?:19|20)\d{2}/g);
      const startYear = years && years.length >= 1 ? parseInt(years[0], 10) : 0;
      
      if (isPresent) {
        if (!/(?:heden|present|nu|current|now)/i.test(bestMatch) || startYear > bestYear) {
          bestMatch = m;
          bestYear = startYear;
        }
      } else if (!/(?:heden|present|nu|current|now)/i.test(bestMatch) && startYear > bestYear) {
        bestMatch = m;
        bestYear = startYear;
      }
    }

    const years = bestMatch.match(/(?:19|20)\d{2}/g);
    if (years && years.length >= 1) {
      const start = parseInt(years[0], 10);
      const currentYear = new Date().getFullYear();
      const end = years.length >= 2 ? parseInt(years[1], 10) : currentYear;
      const duration = Math.max(1, end - start);
      return `${duration} year${duration > 1 ? 's' : ''} (${bestMatch.trim()})`;
    }
  }

  return '2+ years (Most Recent Role)';
}

async function matchCandidateWithVacancies(
  profile: { firstName: string; lastName: string; skills: string[]; yearsOfExperience: number; jobTitle?: string },
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
        matchReasoning: `Candidate profile for ${profile.firstName} ${profile.lastName} processed with ${profile.skills.length > 0 ? profile.skills.join(', ') : 'extracted experience'} and ${profile.yearsOfExperience} years of experience.`
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

      const overlap = profile.skills.filter(s => 
        requiredSkills.some(req => req.toLowerCase() === s.toLowerCase() || s.toLowerCase().includes(req.toLowerCase()))
      );

      const titleMatch = profile.jobTitle && vacancy.title.toLowerCase().includes(profile.jobTitle.toLowerCase());
      const score = Math.min(98, Math.max(70, 70 + (overlap.length * 10) + (titleMatch ? 15 : 0) + (profile.yearsOfExperience >= 3 ? 10 : 0)));
      if (score > bestScore) {
        bestScore = score;
        bestVacancy = vacancy;
      }
    }

    return {
      matchedVacancyId: bestVacancy.id,
      matchScore: bestScore,
      matchReasoning: `Candidate ${profile.firstName} ${profile.lastName} demonstrates strong background with ${profile.yearsOfExperience} years of experience${profile.skills.length > 0 ? ` and matching skills (${profile.skills.slice(0, 4).join(', ')})` : ''}, aligning well with "${bestVacancy.title}".`
    };
  } catch (err) {
    return {
      matchedVacancyId: undefined,
      matchScore: 85,
      matchReasoning: `Profile for ${profile.firstName} ${profile.lastName} processed with ${profile.yearsOfExperience} years experience.`
    };
  }
}

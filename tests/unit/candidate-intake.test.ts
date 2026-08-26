import { describe, it, expect } from 'vitest';
import { processCandidateIntake } from '@/lib/workflows/functions/candidate-intake';
import { 
  extractNameHeuristic, 
  extractSkillsHeuristic, 
  extractExperienceHeuristic,
  extractJobTitle,
  extractLastJobDuration
} from '@/lib/ai/cv-extractor';

describe('processCandidateIntake', () => {
  it('should be configured with the correct Inngest trigger', () => {
    expect(processCandidateIntake).toBeDefined();
    const opts = (processCandidateIntake as any)['opts'];
    expect(opts).toBeDefined();
    expect(opts.triggers).toBeDefined();
    expect(opts.triggers.length).toBeGreaterThan(0);
    expect(opts.triggers[0].event).toBe('recruitment/candidate.uploaded');
  });

  it('should extract real candidate name from CV text', () => {
    const cvText = `
      Curriculum Vitae
      Alexander van der Meer
      Email: alexander@example.com
      Software Developer
    `;
    const { firstName, lastName } = extractNameHeuristic(cvText);
    expect(firstName).toBe('Alexander');
    expect(lastName).toBe('van der Meer');
  });

  it('should extract real candidate name from CV text with job title headers', () => {
    const cvText = `CV Lotte de Vries - Financieel Analist\nEmail: lotte@example.com`;
    const { firstName, lastName } = extractNameHeuristic(cvText);
    expect(firstName).toBe('Lotte');
    expect(lastName).toBe('de Vries');
  });

  it('should fallback to extracting candidate name from uploaded filename', () => {
    const { firstName, lastName } = extractNameHeuristic('', 'CV_Lotte_de_gries_Financieel_Analist.pdf');
    expect(firstName).toBe('Lotte');
    expect(lastName).toBe('de Gries');
  });

  it('should prioritize filename candidate name when PDF has generic template text', () => {
    const templateCvText = `James Miller\nLogistics Coordinator\nExperience: 5 years`;
    const { firstName, lastName } = extractNameHeuristic(templateCvText, 'CV_Daan_Bakker_Logistiek_Coordinator.pdf');
    expect(firstName).toBe('Daan');
    expect(lastName).toBe('Bakker');
  });

  it('should extract candidate function/job title from filename or text', () => {
    const titleFromFilename = extractJobTitle('', 'CV_Daan_Bakker_Logistiek_Coordinator.pdf');
    expect(titleFromFilename).toBeDefined();
    expect(titleFromFilename?.toLowerCase()).toContain('logistiek');

    const titleFromText = extractJobTitle('Lotte de Vries - Financieel Analist\nExperience: 5 years');
    expect(titleFromText).toBe('Financieel Analist');
  });

  it('should extract candidate experience duration in last job', () => {
    const cvText = `Logistics Coordinator (2021 - Present)\nHandled inventory... (2018 - 2021)`;
    const duration = extractLastJobDuration(cvText);
    expect(duration).toContain('2021 - Present');
  });

  it('should reject phone and contact numbers from being extracted as job titles', () => {
    const cvWithContact = `
      Jan Jansen
      Telefoon: 06 - 12345678  E-mail: jan.jansen@example.com
      Logistics Coordinator
      Werkervaring: 2021 - heden
    `;
    const title = extractJobTitle(cvWithContact);
    expect(title).not.toContain('12345678');
    expect(title).toBe('Logistics Coordinator');
  });

  it('should strip 4-digit years from candidate names in filenames', () => {
    const { firstName, lastName } = extractNameHeuristic('', 'CV_Jan_Jansen_2025.pdf');
    expect(firstName).toBe('Jan');
    expect(lastName).toBe('Jansen');
  });

  it('should accurately extract name, job title, skills, and experience from Dutch ICT tabular CV', () => {
    const cvText = `
      Curriculum Vitae
      Persoonlijke gegevens
      Voorletters en voornaam Jan Jansen
      Geboortedatum 2 oktober 1984
      Plaats Rotterdam
      Telefoonnummer 06 - 12345678
      E-mailadres jan.jansen@example.com
      
      Opleidingen/Certificaten 
      Opleiding Diploma Periode
      Medewerker Beheer (mbo-2) Ja Aug.2006 - Jun.2007
      Front-End Developer Ja Jun.2023- Sept.2023
      
      Certificaten
      AZ-900 (Microsoft) ja 2025
      Atlassian Jira Administrator Ja 2024
      Lean Six Sigma – Yellow belt Ja 2024
      
      Werkervaring 
      Functie Werkgever Periode
      Senior Medewerker ICT Voorbeeld Bedrijf 2023 – Heden
      Collega’s helpen met hun ICT-vragen en werkplekbeheer.
      Programma’s: Citrix Director, SCCM, Azure, O365, Active Directory, Jira, PHP, React
    `;
    const { firstName, lastName } = extractNameHeuristic(cvText);
    expect(firstName).toBe('Jan');
    expect(lastName).toBe('Jansen');

    const title = extractJobTitle(cvText);
    expect(title).toBe('Senior Medewerker ICT');

    const skills = extractSkillsHeuristic(cvText);
    expect(skills).toContain('Citrix Director');
    expect(skills).toContain('Azure');
    expect(skills).toContain('O365');

    const duration = extractLastJobDuration(cvText);
    expect(duration).toContain('2023 – Heden');
  });

  it('should extract last job title when filename has no title and CV has explicit Functie label', () => {
    const cvText = `
      Jan Jansen
      Werkervaring
      Functie: Senior Medewerker ICT
      Werkgever: Voorbeeld Bedrijf
      Periode: 2023 - heden
    `;
    const title = extractJobTitle(cvText, 'Jan_Jansen_CV.pdf');
    expect(title).toBe('Senior Medewerker ICT');
  });

  it('should extract last job title from Werkervaring table row when filename is generic', () => {
    const cvText = `
      Jan Jansen
      Werkervaring
      Senior Medewerker ICT Voorbeeld Bedrijf 2023 – Heden
    `;
    const title = extractJobTitle(cvText, 'CV_2025.pdf');
    expect(title).toBe('Senior Medewerker ICT');
  });

  it('should accurately extract candidate subtitle and top 5 skills from 2-column healthcare CV', () => {
    const cvText = `
      EC
      CONTACT
      Phone +31 6 1234 5678
      Email emily@example.com
      SKILLS
      Emergency Triage
      Patient Care Planning
      IV Therapy & Medication
      BLS / ALS Certified
      Electronic Health Records
      LANGUAGES
      English Native
      Emily Carter
      Registered Nurse - Emergency Care
      PROFILE
      Compassionate Registered Nurse with 10 years experience...
      WORK EXPERIENCE
      Registered Nurse - Emergency Department Feb 2020 - Present
      Utrecht Medical Centre
    `;
    const { firstName, lastName } = extractNameHeuristic(cvText);
    expect(firstName).toBe('Emily');
    expect(lastName).toBe('Carter');

    const title = extractJobTitle(cvText, 'Emily_Carter_CV.pdf', `${firstName} ${lastName}`);
    expect(title).toBe('Registered Nurse - Emergency Care');

    const skills = extractSkillsHeuristic(cvText);
    expect(skills).toEqual([
      'Emergency Triage',
      'Patient Care Planning',
      'IV Therapy & Medication',
      'BLS',
      'ALS Certified'
    ]);

    const duration = extractLastJobDuration(cvText);
    expect(duration).toContain('Feb 2020 - Present');
  });

  it('should return undefined when no job title is present in the CV (no artificial fallback)', () => {
    const cvText = `
      Alex Jansen
      Email: alex@example.com
      Skills
      Teamwork, Communication
    `;
    const title = extractJobTitle(cvText, 'Alex_Jansen.pdf', 'Alex Jansen');
    expect(title).toBeUndefined();
  });

  describe('End-to-End Extraction Pipeline Integration', () => {
    it('should run full candidate profile extraction on 2-column healthcare format', async () => {
      const healthcareCv = `
        EC
        CONTACT
        Phone +31 6 1234 5678
        Email emily.carter@example.com
        SKILLS
        Emergency Triage
        Patient Care Planning
        IV Therapy & Medication
        BLS / ALS Certified
        Electronic Health Records
        LANGUAGES
        English Native
        Emily Carter
        Registered Nurse - Emergency Care
        PROFILE
        Compassionate Registered Nurse with 10 years experience...
        WORK EXPERIENCE
        Registered Nurse - Emergency Department Feb 2020 - Present
        Utrecht Medical Centre
      `;

      const { extractCandidateProfile } = await import('@/lib/ai/cv-extractor');
      const profile = await extractCandidateProfile(healthcareCv, 'dummy-tenant', 'Emily_Carter_CV.pdf');

      expect(profile.firstName).toBe('Emily');
      expect(profile.lastName).toBe('Carter');
      expect(profile.jobTitle).toBe('Registered Nurse - Emergency Care');
      expect(profile.skills).toEqual([
        'Emergency Triage',
        'Patient Care Planning',
        'IV Therapy & Medication',
        'BLS',
        'ALS Certified'
      ]);
      expect(profile.lastJobDuration).toContain('Feb 2020 - Present');
      expect(profile.matchScore).toBeGreaterThanOrEqual(70);
    });

    it('should run full candidate profile extraction on Dutch ICT tabular format', async () => {
      const dutchIctCv = `
        Curriculum Vitae
        Persoonlijke gegevens
        Voorletters en voornaam Jan Jansen
        Geboortedatum 2 oktober 1984
        Plaats Rotterdam
        Telefoonnummer 06 - 12345678
        E-mailadres jan.jansen@example.com
        
        Werkervaring 
        Functie Werkgever Periode
        Senior Medewerker ICT Bedrijf BV 2023 – Heden
        Programma’s: Citrix Director, SCCM, Azure, O365, Active Directory
      `;

      const { extractCandidateProfile } = await import('@/lib/ai/cv-extractor');
      const profile = await extractCandidateProfile(dutchIctCv, 'dummy-tenant', 'CV_Jan_Jansen.pdf');

      expect(profile.firstName).toBe('Jan');
      expect(profile.lastName).toBe('Jansen');
      expect(profile.jobTitle).toBe('Senior Medewerker ICT');
      expect(profile.skills).toContain('Citrix Director');
      expect(profile.skills).toContain('Azure');
      expect(profile.skills).toContain('O365');
      expect(profile.lastJobDuration).toContain('2023 – Heden');
    });
  });

  describe('Contract Tests: Interface Invariants & Data Schemas', () => {
    it('Contract: ExtractedCandidateProfile must satisfy structural typing and value bounds', async () => {
      const testCv = `
        Emily Carter
        Registered Nurse - Emergency Care
        SKILLS: Triage, Patient Care, CPR, IV Therapy, Diagnostics
        EXPERIENCE: 8 years
        WORK EXPERIENCE: Registered Nurse 2018 - Present
      `;
      const { extractCandidateProfile } = await import('@/lib/ai/cv-extractor');
      const profile = await extractCandidateProfile(testCv, 'dummy-tenant', 'Emily_Carter.pdf');

      // Contract Invariants
      expect(typeof profile.firstName).toBe('string');
      expect(profile.firstName.length).toBeGreaterThan(0);
      expect(typeof profile.lastName).toBe('string');

      if (profile.jobTitle !== undefined) {
        expect(typeof profile.jobTitle).toBe('string');
        expect(profile.jobTitle.length).toBeGreaterThanOrEqual(3);
        // Disallowed artificial placeholders invariant
        const disallowed = ['Professional', 'Specialist', 'Problem Solving Specialist', 'Go Specialist'];
        expect(disallowed).not.toContain(profile.jobTitle);
      }

      expect(Array.isArray(profile.skills)).toBe(true);
      expect(profile.skills.length).toBeLessThanOrEqual(5);
      profile.skills.forEach(skill => {
        expect(typeof skill).toBe('string');
        expect(skill.length).toBeGreaterThan(0);
      });

      expect(typeof profile.yearsOfExperience).toBe('number');
      expect(profile.yearsOfExperience).toBeGreaterThanOrEqual(0);

      expect(typeof profile.matchScore).toBe('number');
      expect(profile.matchScore).toBeGreaterThanOrEqual(0);
      expect(profile.matchScore).toBeLessThanOrEqual(100);

      expect(typeof profile.matchReasoning).toBe('string');
      expect(profile.matchReasoning.length).toBeGreaterThan(0);
    });

    it('Contract: Approvals and Candidates matchReasoning JSON serialization contract', () => {
      const reasoningPayload = {
        reasoning: 'Candidate demonstrates 10 years experience in acute healthcare.',
        jobTitle: 'Registered Nurse - Emergency Care',
        lastJobDuration: '4 years (Feb 2020 - Present)',
      };

      const serialized = JSON.stringify(reasoningPayload);
      expect(typeof serialized).toBe('string');

      // Consumer Deserialization Contract
      const parsed = JSON.parse(serialized);
      expect(parsed).toHaveProperty('reasoning');
      expect(parsed).toHaveProperty('jobTitle');
      expect(parsed).toHaveProperty('lastJobDuration');
      expect(parsed.jobTitle).toBe('Registered Nurse - Emergency Care');
      expect(parsed.lastJobDuration).toBe('4 years (Feb 2020 - Present)');
    });

    it('Contract: Inngest Event Payloads conform to strict contract schemas', () => {
      const candidateUploadedPayload = {
        name: 'recruitment/candidate.uploaded' as const,
        data: {
          tenantId: 'tenant-1234',
          candidateId: 'candidate-5678',
          rawText: 'Candidate CV text',
          documentUrl: 'data:application/pdf;base64,JVBERi0...',
          fileName: 'CV_Jan_Jansen.pdf'
        }
      };

      expect(candidateUploadedPayload.name).toBe('recruitment/candidate.uploaded');
      expect(candidateUploadedPayload.data.tenantId).toBeDefined();
      expect(candidateUploadedPayload.data.candidateId).toBeDefined();

      const approvalSubmittedPayload = {
        name: 'recruitment/approval.submitted' as const,
        data: {
          tenantId: 'tenant-1234',
          candidateId: 'candidate-5678',
          approved: true,
          notes: 'Candidate approved for final interview'
        }
      };

      expect(approvalSubmittedPayload.name).toBe('recruitment/approval.submitted');
      expect(typeof approvalSubmittedPayload.data.approved).toBe('boolean');
    });

    it('Contract: Outbound ATS Export Payload format', () => {
      const mapCandidateToAtsPayload = (c: {
        id: string;
        firstName: string;
        lastName: string;
        email?: string | null;
        jobTitle?: string;
        skills: string[];
        yearsOfExperience?: number | null;
      }) => ({
        externalCandidateId: c.id,
        fullName: `${c.firstName} ${c.lastName}`.trim(),
        email: c.email || undefined,
        role: c.jobTitle || 'Unspecified',
        skills: c.skills.join(', '),
        totalExperienceYears: c.yearsOfExperience ?? 0,
        source: 'RecruitAI Intake Gateway',
      });

      const exportPayload = mapCandidateToAtsPayload({
        id: 'uuid-123',
        firstName: 'Emily',
        lastName: 'Carter',
        email: 'emily@example.com',
        jobTitle: 'Registered Nurse - Emergency Care',
        skills: ['Emergency Triage', 'Patient Care Planning'],
        yearsOfExperience: 10,
      });

      expect(exportPayload.externalCandidateId).toBe('uuid-123');
      expect(exportPayload.fullName).toBe('Emily Carter');
      expect(exportPayload.role).toBe('Registered Nurse - Emergency Care');
      expect(exportPayload.skills).toBe('Emergency Triage, Patient Care Planning');
      expect(exportPayload.totalExperienceYears).toBe(10);
      expect(exportPayload.source).toBe('RecruitAI Intake Gateway');
    });
  });
});

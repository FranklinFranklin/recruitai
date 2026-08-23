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
    expect(titleFromFilename.toLowerCase()).toContain('logistiek');

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
      Franklin Santos
      Telefoon: 06 - 27257712  E-mail: franklin@example.com
      Logistics Coordinator
      Werkervaring: 2021 - heden
    `;
    const title = extractJobTitle(cvWithContact);
    expect(title).not.toContain('27257712');
    expect(title).toBe('Logistics Coordinator');
  });

  it('should strip 4-digit years from candidate names in filenames', () => {
    const { firstName, lastName } = extractNameHeuristic('', 'CV_Franklin_Santos_2025.pdf');
    expect(firstName).toBe('Franklin');
    expect(lastName).toBe('Santos');
  });

  it('should accurately extract name, job title, skills, and experience from Dutch ICT tabular CV', () => {
    const cvText = `
      Curriculum Vitae
      Persoonlijke gegevens
      Voorletters en voornaam Franklin Santos
      Geboortedatum 2 oktober 1984
      Plaats Rotterdam
      Telefoonnummer 06 - 27257712
      E-mailadres dhr.Franklin@gmail.com
      
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
      Senior Medewerker ICT Star-shl 2023 – Heden
      Collega’s helpen met hun ICT-vragen en werkplekbeheer.
      Programma’s: Citrix Director, SCCM, Azure, O365, Active Directory, Jira, PHP, React
    `;
    const { firstName, lastName } = extractNameHeuristic(cvText);
    expect(firstName).toBe('Franklin');
    expect(lastName).toBe('Santos');

    const title = extractJobTitle(cvText);
    expect(title).toBe('Senior Medewerker ICT');

    const skills = extractSkillsHeuristic(cvText);
    expect(skills).toContain('Citrix');
    expect(skills).toContain('Azure');
    expect(skills).toContain('React');

    const duration = extractLastJobDuration(cvText);
    expect(duration).toContain('2023 – Heden');
  });
});

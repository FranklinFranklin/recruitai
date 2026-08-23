import { describe, it, expect } from 'vitest';
import { processCandidateIntake } from '@/lib/workflows/functions/candidate-intake';
import { extractNameHeuristic, extractSkillsHeuristic, extractExperienceHeuristic } from '@/lib/ai/cv-extractor';

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
});

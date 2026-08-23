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

  it('should extract real candidate skills and experience from CV text', () => {
    const cvText = `
      Maria Jansen
      Ervaren Full Stack Ontwikkelaar met 6 jaar ervaring in web development.
      Vaardigheden: React, TypeScript, Next.js, Node.js, PostgreSQL, Docker en Git.
    `;
    const skills = extractSkillsHeuristic(cvText);
    const exp = extractExperienceHeuristic(cvText);

    expect(skills).toContain('React');
    expect(skills).toContain('TypeScript');
    expect(skills).toContain('Next.js');
    expect(skills).toContain('Node.js');
    expect(skills).toContain('PostgreSQL');
    expect(skills).toContain('Docker');
    expect(skills).toContain('Git');
    expect(exp).toBe(6);
  });
});

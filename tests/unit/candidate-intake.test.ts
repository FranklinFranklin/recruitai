import { describe, it, expect } from 'vitest';
import { processCandidateIntake } from '@/lib/workflows/functions/candidate-intake';

describe('processCandidateIntake', () => {
  it('should be configured with the correct Inngest trigger', () => {
    // processCandidateIntake is an Inngest function instance
    // it has an opts property in Inngest v3/v4 which contains triggers
    expect(processCandidateIntake).toBeDefined();
    
    // We want to ensure it has at least one trigger registered (so it doesn't drop events)
    const opts = (processCandidateIntake as any)['opts'];
    expect(opts).toBeDefined();
    
    // In Inngest v4, triggers is an array, e.g. [{ event: '...' }]
    // When correctly defined, triggers should have length > 0
    expect(opts.triggers).toBeDefined();
    expect(opts.triggers.length).toBeGreaterThan(0);
    expect(opts.triggers[0].event).toBe('recruitment/candidate.uploaded');
  });
});

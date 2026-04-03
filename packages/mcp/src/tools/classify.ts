import { z } from 'zod';
import { classifyFailures } from '@kairo/classifier';
import type { RunResultSnapshot } from '@kairo/classifier';
import { ok, err } from '../types.js';

export const ClassifyInputSchema = z.object({
  run1: z.array(z.record(z.unknown())).describe('Results from the first test run'),
  run2: z.array(z.record(z.unknown())).describe('Results from the re-run of failed tests'),
});

export type ClassifyInput = z.infer<typeof ClassifyInputSchema>;

export async function handleClassifyFailures(input: ClassifyInput) {
  try {
    const run1 = input.run1 as unknown as RunResultSnapshot[];
    const run2 = input.run2 as unknown as RunResultSnapshot[];
    const result = classifyFailures(run1, run2);
    return ok(result);
  } catch (error: unknown) {
    return err(error);
  }
}

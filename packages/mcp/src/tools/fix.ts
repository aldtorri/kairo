import { z } from 'zod';
import { generateFixes } from '@kairo/fixer';
import type { ClassifiedFailureSnapshot } from '@kairo/fixer';
import { ok, err } from '../types.js';

export const FixInputSchema = z.object({
  failures: z
    .array(z.record(z.unknown()))
    .describe('Classified failures from classify_failures'),
});

export type FixInput = z.infer<typeof FixInputSchema>;

export async function handleGetFixes(input: FixInput) {
  try {
    const failures = input.failures as unknown as ClassifiedFailureSnapshot[];
    const result = await generateFixes(failures);
    return ok(result);
  } catch (error: unknown) {
    return err(error);
  }
}

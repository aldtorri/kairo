import { z } from 'zod';
import { runTests } from '@kairo/runner';
import { ok, err } from '../types.js';

export const RunInputSchema = z.object({
  specFiles: z.array(z.string()).describe('Paths to .spec.ts files to run'),
  targetUrl: z.string().url().describe('Base URL of the running application'),
});

export type RunInput = z.infer<typeof RunInputSchema>;

export async function handleRunTests(input: RunInput) {
  try {
    const [run1, run2] = await runTests(input.specFiles, input.targetUrl);
    return ok({ run1, run2 });
  } catch (error: unknown) {
    return err(error);
  }
}

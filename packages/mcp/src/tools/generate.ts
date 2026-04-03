import { z } from 'zod';
import { generateTests } from '@kairo/generator';
import type { AnalyzerSnapshot } from '@kairo/generator';
import { ok, err } from '../types.js';

export const GenerateInputSchema = z.object({
  analyzerResult: z.record(z.unknown()).describe('Output from analyze_project'),
  targetUrl: z.string().url().describe('Base URL of the running application'),
});

export type GenerateInput = z.infer<typeof GenerateInputSchema>;

export async function handleGenerateTests(input: GenerateInput) {
  try {
    const result = await generateTests({
      analyzerResult: input.analyzerResult as unknown as AnalyzerSnapshot,
      targetUrl: input.targetUrl,
    });
    return ok(result);
  } catch (error: unknown) {
    return err(error);
  }
}

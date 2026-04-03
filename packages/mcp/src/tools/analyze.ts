import { z } from 'zod';
import { analyzeProject } from '@kairo/analyzer';
import { ok, err } from '../types.js';

export const AnalyzeInputSchema = z.object({
  projectPath: z.string().describe('Absolute path to the project to analyze'),
});

export type AnalyzeInput = z.infer<typeof AnalyzeInputSchema>;

export async function handleAnalyzeProject(input: AnalyzeInput) {
  try {
    const result = await analyzeProject(input.projectPath);
    return ok(result);
  } catch (error: unknown) {
    return err(error);
  }
}

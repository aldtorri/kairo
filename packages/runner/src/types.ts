import { z } from 'zod';

export const RunResultSchema = z.object({
  testId: z.string(),
  file: z.string(),
  title: z.string(),
  status: z.enum(['pass', 'fail', 'skip', 'timeout']),
  duration: z.number(),
  errorMessage: z.string().optional(),
  screenshotPath: z.string().optional(),
  tracePath: z.string().optional(),
  stdout: z.string().optional(),
  stderr: z.string().optional(),
});

export type RunResult = z.infer<typeof RunResultSchema>;

export interface RunnerInput {
  specFiles: string[];
  targetUrl: string;
  outputDir?: string;
}

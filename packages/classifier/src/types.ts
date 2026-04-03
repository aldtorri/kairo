import { z } from 'zod';

export const FailureCategorySchema = z.enum(['bug', 'flaky', 'env', 'security']);
export type FailureCategory = z.infer<typeof FailureCategorySchema>;

export const ClassifiedFailureSchema = z.object({
  testId: z.string(),
  file: z.string(),
  title: z.string(),
  category: FailureCategorySchema,
  run1ErrorMessage: z.string().optional(),
  run2ErrorMessage: z.string().optional(),
  screenshotPath: z.string().optional(),
  tracePath: z.string().optional(),
  evidence: z.string(),
});

export type ClassifiedFailure = z.infer<typeof ClassifiedFailureSchema>;

// Minimal RunResult shape needed by classifier (avoids cross-package import)
export interface RunResultSnapshot {
  testId: string;
  file: string;
  title: string;
  status: 'pass' | 'fail' | 'skip' | 'timeout';
  duration: number;
  errorMessage?: string;
  screenshotPath?: string;
  tracePath?: string;
}

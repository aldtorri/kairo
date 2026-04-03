import { z } from 'zod';

export const FixConfidenceSchema = z.enum(['high', 'medium', 'low']);
export type FixConfidence = z.infer<typeof FixConfidenceSchema>;

export const FixRecommendationSchema = z.object({
  testId: z.string(),
  confidence: FixConfidenceSchema,
  description: z.string(),
  codeSnippet: z.string().optional(),
  affectedFile: z.string().optional(),
});

export type FixRecommendation = z.infer<typeof FixRecommendationSchema>;

// Minimal ClassifiedFailure shape needed by fixer (avoids cross-package import)
export interface ClassifiedFailureSnapshot {
  testId: string;
  file: string;
  title: string;
  category: 'bug' | 'flaky' | 'env' | 'security';
  run1ErrorMessage?: string;
  run2ErrorMessage?: string;
  screenshotPath?: string;
  tracePath?: string;
  evidence: string;
}

import { z } from 'zod';

// Minimal shape of AnalyzerResult needed by generator (avoids cross-package import)
export interface AnalyzerSnapshot {
  projectPath: string;
  stack: {
    framework: string;
    frontend?: string;
    language: string;
    hasTests: boolean;
  };
  routes: Array<{ path: string; file: string; type: string }>;
  endpoints: Array<{
    method: string;
    path: string;
    file: string;
    line?: number;
    requiresAuth?: boolean;
  }>;
  authStrategy: { type: string; details?: string };
  staticAssets: string[];
}

export interface GeneratorInput {
  analyzerResult: AnalyzerSnapshot;
  targetUrl: string;
}

export const GeneratedTestSchema = z.object({
  fileName: z.string(),
  content: z.string(),
  type: z.enum(['frontend', 'backend', 'security']),
  filePath: z.string().optional(),
});

export type GeneratedTest = z.infer<typeof GeneratedTestSchema>;

export const GeneratedTestsOutputSchema = z.object({
  tests: z.array(GeneratedTestSchema),
});

export type GeneratedTestsOutput = z.infer<typeof GeneratedTestsOutputSchema>;

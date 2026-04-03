import { readdir } from 'node:fs/promises';
import { detectStack } from './detectors/stack.js';
import { detectRoutes } from './detectors/routes.js';
import { detectAuthStrategy } from './detectors/auth.js';
import { AnalyzerResultSchema } from './types.js';
import type { AnalyzerResult } from './types.js';

export type { AnalyzerResult, Stack, Endpoint, Route, AuthStrategy } from './types.js';
export { AnalyzerResultSchema } from './types.js';

export async function analyzeProject(projectPath: string): Promise<AnalyzerResult> {
  const [stack, { routes, endpoints }, authStrategy] = await Promise.all([
    detectStack(projectPath),
    detectRoutes(projectPath),
    detectAuthStrategy(projectPath),
  ]);

  const staticAssets = await detectStaticAssets(projectPath);

  const result: AnalyzerResult = {
    projectPath,
    stack,
    routes,
    endpoints,
    authStrategy,
    staticAssets,
  };

  return AnalyzerResultSchema.parse(result);
}

async function detectStaticAssets(projectPath: string): Promise<string[]> {
  const staticDirs = ['public', 'static', 'assets'];
  const found: string[] = [];

  for (const dir of staticDirs) {
    try {
      const entries = await readdir(`${projectPath}/${dir}`, {
        withFileTypes: true,
        encoding: 'utf-8',
      });
      for (const entry of entries) {
        if (entry.isFile()) found.push(`${dir}/${entry.name}`);
      }
    } catch {
      // directory doesn't exist, skip
    }
  }

  return found;
}

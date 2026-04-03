import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { buildFrontendPrompt } from './prompts/frontend.js';
import { buildBackendPrompt } from './prompts/backend.js';
import { buildSecurityPrompt } from './prompts/security.js';
import { callOpenAI } from './openai-caller.js';
import type { GeneratorInput, GeneratedTest } from './types.js';

export type { GeneratorInput, GeneratedTest, AnalyzerSnapshot } from './types.js';

export async function generateTests(
  input: GeneratorInput
): Promise<GeneratedTest[]> {
  const outDir = join(tmpdir(), `kairo-${Date.now()}`);
  await mkdir(outDir, { recursive: true });

  const prompts: Array<{ type: GeneratedTest['type']; prompt: string; fileName: string }> =
    [
      {
        type: 'frontend',
        prompt: buildFrontendPrompt(input),
        fileName: 'frontend.spec.ts',
      },
      {
        type: 'backend',
        prompt: buildBackendPrompt(input),
        fileName: 'backend.spec.ts',
      },
      {
        type: 'security',
        prompt: buildSecurityPrompt(input),
        fileName: 'security.spec.ts',
      },
    ];

  const results = await Promise.allSettled(
    prompts.map(async ({ type, prompt, fileName }) => {
      const content = await callOpenAI(prompt);
      const filePath = join(outDir, fileName);
      await writeFile(filePath, content, 'utf-8');
      return { fileName, content, type, filePath } satisfies GeneratedTest;
    })
  );

  const tests: GeneratedTest[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      tests.push(result.value);
    } else {
      // Log but don't throw — partial generation is acceptable
      console.error(`[generator] Failed to generate test:`, result.reason);
    }
  }

  if (tests.length === 0) {
    throw new Error('All test generation attempts failed');
  }

  return tests;
}

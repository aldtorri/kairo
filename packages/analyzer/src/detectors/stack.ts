import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Stack } from '../types.js';

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

export async function detectStack(projectPath: string): Promise<Stack> {
  let packageJson: PackageJson = {};
  try {
    const raw = await readFile(join(projectPath, 'package.json'), 'utf-8');
    packageJson = JSON.parse(raw) as PackageJson;
  } catch {
    return {
      framework: 'unknown',
      frontend: 'unknown',
      language: 'javascript',
      hasTests: false,
    };
  }

  const allDeps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };

  const framework = detectFramework(allDeps);
  const frontend = detectFrontend(allDeps);
  const language = 'typescript' in allDeps ? 'typescript' : 'javascript';
  const hasTests =
    'jest' in allDeps ||
    'vitest' in allDeps ||
    'mocha' in allDeps ||
    '@playwright/test' in allDeps;

  return { framework, frontend, language, hasTests };
}

function detectFramework(deps: Record<string, string>): Stack['framework'] {
  if ('next' in deps) return 'nextjs';
  if ('fastify' in deps) return 'fastify';
  if ('express' in deps) return 'express';
  return 'unknown';
}

function detectFrontend(
  deps: Record<string, string>
): Stack['frontend'] {
  if ('next' in deps) return 'react';
  if ('react' in deps || 'react-dom' in deps) return 'react';
  if ('vue' in deps) return 'vue';
  if ('svelte' in deps) return 'svelte';
  return 'none';
}

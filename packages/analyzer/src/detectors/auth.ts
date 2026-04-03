import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { AuthStrategy } from '../types.js';
import { collectSourceFiles } from './routes.js';

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

export async function detectAuthStrategy(
  projectPath: string
): Promise<AuthStrategy> {
  // Check package.json first for auth libraries
  let packageJson: PackageJson = {};
  try {
    const raw = await readFile(join(projectPath, 'package.json'), 'utf-8');
    packageJson = JSON.parse(raw) as PackageJson;
  } catch {
    // ignore
  }

  const allDeps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };

  if ('next-auth' in allDeps || '@auth/core' in allDeps) {
    return { type: 'next-auth', details: 'next-auth detected in dependencies' };
  }

  if ('passport' in allDeps || 'passport-local' in allDeps || 'passport-jwt' in allDeps) {
    return { type: 'passport', details: 'passport detected in dependencies' };
  }

  // Scan source files for auth patterns
  const sourceFiles = await collectSourceFiles(projectPath);

  for (const filePath of sourceFiles) {
    const content = await readFile(filePath, 'utf-8').catch(() => '');

    if (/jsonwebtoken|jwt\.sign|jwt\.verify/i.test(content)) {
      return { type: 'jwt', details: `JWT usage found in ${filePath}` };
    }

    if (/express-session|req\.session/i.test(content)) {
      return { type: 'session', details: `Session usage found in ${filePath}` };
    }

    if (/cookie\.serialize|res\.cookie|req\.cookies/i.test(content)) {
      return {
        type: 'session',
        details: `Cookie-based auth pattern found in ${filePath}`,
      };
    }
  }

  return { type: 'none', details: 'No auth patterns detected' };
}

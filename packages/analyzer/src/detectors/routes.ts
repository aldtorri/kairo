import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';
import type { Endpoint, Route } from '../types.js';

const EXPRESS_ROUTE_RE =
  /(?:router|app)\.(get|post|put|patch|delete|all)\s*\(\s*['"`]([^'"`]+)['"`]/gi;

const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  'coverage',
]);

export async function detectRoutes(projectPath: string): Promise<{
  routes: Route[];
  endpoints: Endpoint[];
}> {
  const routes: Route[] = [];
  const endpoints: Endpoint[] = [];

  const sourceFiles = await collectSourceFiles(projectPath);

  for (const filePath of sourceFiles) {
    const content = await readFile(filePath, 'utf-8').catch(() => '');
    const relPath = relative(projectPath, filePath);

    // Detect Express endpoints
    const expressEndpoints = detectExpressEndpoints(content, relPath);
    endpoints.push(...expressEndpoints);

    // Detect Next.js pages
    const nextRoutes = detectNextRoutes(filePath, relPath);
    routes.push(...nextRoutes);
  }

  return { routes, endpoints };
}

function detectExpressEndpoints(content: string, filePath: string): Endpoint[] {
  const found: Endpoint[] = [];
  const lines = content.split('\n');

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx] ?? '';
    let match: RegExpExecArray | null;
    const re =
      /(?:router|app)\.(get|post|put|patch|delete|all)\s*\(\s*['"`]([^'"`]+)['"`]/gi;

    while ((match = re.exec(line)) !== null) {
      const method = (match[1] ?? 'GET').toUpperCase() as Endpoint['method'];
      const path = match[2] ?? '/';
      found.push({ method, path, file: filePath, line: lineIdx + 1 });
    }
  }

  return found;
}

function detectNextRoutes(filePath: string, relPath: string): Route[] {
  const routes: Route[] = [];

  // Next.js app directory: app/**/page.tsx
  if (relPath.includes('app/') && /page\.(tsx?|jsx?)$/.test(filePath)) {
    const routePath = relPath
      .replace(/^.*app\//, '/')
      .replace(/\/page\.(tsx?|jsx?)$/, '') || '/';
    routes.push({ path: routePath, file: relPath, type: 'page' });
  }

  // Next.js pages directory: pages/**/*.tsx (not _app, _document)
  if (
    relPath.includes('pages/') &&
    /\.(tsx?|jsx?)$/.test(filePath) &&
    !/(^|\/)_/.test(relPath)
  ) {
    const routePath = relPath
      .replace(/^.*pages\//, '/')
      .replace(/\.(tsx?|jsx?)$/, '')
      .replace(/\/index$/, '') || '/';
    routes.push({ path: routePath, file: relPath, type: 'page' });
  }

  return routes;
}

async function collectSourceFiles(dir: string): Promise<string[]> {
  const files: string[] = [];

  async function walk(current: string): Promise<void> {
    let entries: import('node:fs').Dirent<string>[];
    try {
      entries = await readdir(current, { withFileTypes: true, encoding: 'utf-8' });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (IGNORED_DIRS.has(entry.name)) continue;
      const full = join(current, entry.name);

      if (entry.isDirectory()) {
        await walk(full);
      } else if (/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(entry.name)) {
        const s = await stat(full).catch(() => null);
        if (s && s.isFile()) files.push(full);
      }
    }
  }

  await walk(dir);
  return files;
}

// Re-export for use in auth detector
export { collectSourceFiles };
export { EXPRESS_ROUTE_RE };

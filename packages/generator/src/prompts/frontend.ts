import type { GeneratorInput } from '../types.js';

export function buildFrontendPrompt(input: GeneratorInput): string {
  const { analyzerResult, targetUrl } = input;
  const routes =
    analyzerResult.routes.map((r: { path: string }) => r.path).join(', ') ||
    'none detected';

  return `You are a Playwright test generator. Generate a comprehensive E2E test file for a web application.

Target URL: ${targetUrl}
Frontend framework: ${analyzerResult.stack.frontend ?? 'unknown'}
Detected routes: ${routes}

Generate a Playwright spec file that:
1. Tests each detected route loads successfully (HTTP 200, no console errors)
2. Tests basic navigation between pages
3. Tests form submissions if forms are present (use getByRole, getByLabel selectors)
4. Tests responsive layout at 1280x720 and 375x667 viewports
5. Uses accessibility-first selectors (getByRole, getByLabel, getByPlaceholder, getByText)
6. Never uses page.waitForTimeout() - use proper Playwright waiting instead
7. Includes trace collection with { trace: 'on' }

Return ONLY valid TypeScript code for a Playwright spec file. No markdown, no explanation.
File must import from '@playwright/test' and export nothing (test file format).
Use descriptive test names. Group related tests with test.describe().`;
}

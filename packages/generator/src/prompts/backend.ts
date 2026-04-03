import type { GeneratorInput } from '../types.js';

export function buildBackendPrompt(input: GeneratorInput): string {
  const { analyzerResult, targetUrl } = input;
  const endpoints = analyzerResult.endpoints
    .map((e: { method: string; path: string }) => `${e.method} ${e.path}`)
    .join('\n    ') || 'none detected';

  return `You are a Playwright API test generator. Generate a comprehensive API contract test file.

Target base URL: ${targetUrl}
Backend framework: ${analyzerResult.stack.framework}
Auth strategy: ${analyzerResult.authStrategy.type}
Detected endpoints:
    ${endpoints}

Generate a Playwright spec file (using request fixtures) that:
1. Tests each detected endpoint returns an appropriate HTTP status code
2. Tests response body shape (has required fields, correct types)
3. Tests auth-protected endpoints return 401 when unauthenticated
4. Tests CORS headers are present on responses
5. Tests Content-Type headers match the response body
6. Uses APIRequestContext from Playwright (test.use({ baseURL }))
7. Groups tests by endpoint with test.describe()

Return ONLY valid TypeScript code for a Playwright spec file. No markdown, no explanation.`;
}

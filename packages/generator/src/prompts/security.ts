import type { GeneratorInput } from '../types.js';

export function buildSecurityPrompt(input: GeneratorInput): string {
  const { analyzerResult, targetUrl } = input;
  const endpoints = analyzerResult.endpoints
    .map((e: { method: string; path: string }) => `${e.method} ${e.path}`)
    .join('\n    ') || 'none detected';

  return `You are a web security test generator using Playwright. Generate basic security tests.

Target URL: ${targetUrl}
Auth strategy: ${analyzerResult.authStrategy.type}
Detected endpoints:
    ${endpoints}

Generate a Playwright spec file that tests:
1. Security headers present on all responses:
   - X-Content-Type-Options: nosniff
   - X-Frame-Options or Content-Security-Policy frame-ancestors
   - Referrer-Policy
2. Auth bypass: accessing protected routes without credentials returns 401/403 (not 200)
3. IDOR basics: incrementing numeric IDs in paths (e.g. /users/1 vs /users/2) requires auth
4. XSS basics: inject <script>alert(1)</script> in form fields, verify it is not reflected unescaped
5. CORS: requests from untrusted origins should not receive Access-Control-Allow-Origin: *
   unless the endpoint is intentionally public

Use Playwright's request fixture for API calls and page fixture for UI checks.
Return ONLY valid TypeScript code for a Playwright spec file. No markdown, no explanation.`;
}

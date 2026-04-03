import type { RunResultSnapshot, FailureCategory } from './types.js';

const ENV_PATTERNS = [
  /ECONNREFUSED/i,
  /ENOTFOUND/i,
  /connect ETIMEDOUT/i,
  /process\.env\.[A-Z_]+ is undefined/i,
  /Cannot find module/i,
  /ENOMEM/i,
];

const SECURITY_PATTERNS = [
  /Expected.*401/i,
  /Expected.*403/i,
  /Unauthorized/i,
  /Forbidden/i,
  /auth.*bypass/i,
  /IDOR/i,
  /XSS/i,
  /Content-Security-Policy/i,
  /X-Frame-Options/i,
];

export function classifyCategory(
  run1: RunResultSnapshot,
  run2: RunResultSnapshot | undefined
): FailureCategory {
  const errorMsg = run1.errorMessage ?? '';

  // Flaky: failed in run1, passed in run2
  // RULE: NEVER classify as flaky without run2 data
  if (run2 !== undefined && run2.status === 'pass') {
    return 'flaky';
  }

  // Env: timeout or known env error patterns
  if (run1.status === 'timeout') {
    return 'env';
  }

  if (ENV_PATTERNS.some((re) => re.test(errorMsg))) {
    return 'env';
  }

  // Security: auth/authorization failure patterns in error or title
  const combined = `${errorMsg} ${run1.title}`;
  if (SECURITY_PATTERNS.some((re) => re.test(combined))) {
    return 'security';
  }

  // Bug: failed in both runs (or no run2 data for a non-env, non-security failure)
  return 'bug';
}

export function buildEvidence(
  run1: RunResultSnapshot,
  run2: RunResultSnapshot | undefined,
  category: FailureCategory
): string {
  const parts: string[] = [];

  parts.push(`Category: ${category}`);
  parts.push(`Run 1 status: ${run1.status}`);

  if (run1.errorMessage) {
    parts.push(`Run 1 error: ${run1.errorMessage.slice(0, 500)}`);
  }

  if (run2 !== undefined) {
    parts.push(`Run 2 status: ${run2.status}`);
    if (run2.errorMessage) {
      parts.push(`Run 2 error: ${run2.errorMessage.slice(0, 500)}`);
    }
  } else {
    parts.push('Run 2: not executed (test passed in run 1)');
  }

  return parts.join('\n');
}

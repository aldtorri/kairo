import type { ClassifiedFailureSnapshot } from '../types.js';

export function buildSecurityFixPrompt(
  failure: ClassifiedFailureSnapshot
): string {
  return `You are a web security expert reviewing a failed security test. Provide a concrete remediation.

Test: ${failure.title}
Test file: ${failure.file}
Error message: ${failure.run1ErrorMessage ?? 'none'}
Evidence:
${failure.evidence}

Based on this security failure, provide:
1. A description of the vulnerability (1-2 sentences, be specific)
2. A concrete code fix to remediate the security issue (e.g., add a header, check auth, sanitize input)
3. The file most likely needing the fix

Respond in this exact JSON format (no markdown):
{
  "description": "...",
  "codeSnippet": "...",
  "affectedFile": "...",
  "confidence": "high" | "medium" | "low"
}

Confidence levels:
- high: Test directly detected missing security header or auth bypass with clear evidence
- medium: Pattern matches a known vulnerability class
- low: Possible security issue but needs more context to confirm`;
}

import type { ClassifiedFailureSnapshot } from '../types.js';

export function buildBugFixPrompt(failure: ClassifiedFailureSnapshot): string {
  return `You are a senior web developer reviewing a failing test. Provide a concrete fix recommendation.

Test: ${failure.title}
Test file: ${failure.file}
Error message (run 1): ${failure.run1ErrorMessage ?? 'none'}
Error message (run 2): ${failure.run2ErrorMessage ?? 'none'}
Evidence:
${failure.evidence}

Based on this information, provide:
1. A brief description of what is likely causing the failure (1-2 sentences)
2. A concrete code fix (the actual code change needed in the application, not in the test)
3. The file most likely affected

Respond in this exact JSON format (no markdown):
{
  "description": "...",
  "codeSnippet": "...",
  "affectedFile": "...",
  "confidence": "high" | "medium" | "low"
}

Confidence levels:
- high: The error message directly points to the bug and you can see the fix
- medium: The pattern matches a known issue type and you have a likely fix
- low: You can only hypothesize based on the test name and error pattern`;
}

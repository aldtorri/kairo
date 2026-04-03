import OpenAI from 'openai';
import { buildBugFixPrompt } from './prompts/bug.js';
import { buildSecurityFixPrompt } from './prompts/security.js';
import { FixRecommendationSchema } from './types.js';
import type { ClassifiedFailureSnapshot, FixRecommendation } from './types.js';

export type { FixRecommendation, ClassifiedFailureSnapshot } from './types.js';
export { FixRecommendationSchema } from './types.js';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate fix recommendations for classified failures.
 * RULE: Never generates fixes for flaky or env failures.
 */
export async function generateFixes(
  failures: ClassifiedFailureSnapshot[]
): Promise<FixRecommendation[]> {
  // S5-2: Guard — skip flaky and env failures
  const actionable = failures.filter(
    (f) => f.category !== 'flaky' && f.category !== 'env'
  );

  const results = await Promise.allSettled(
    actionable.map((failure) => generateSingleFix(failure))
  );

  const fixes: FixRecommendation[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      fixes.push(result.value);
    } else {
      console.error('[fixer] Failed to generate fix:', result.reason);
    }
  }

  return fixes;
}

async function generateSingleFix(
  failure: ClassifiedFailureSnapshot
): Promise<FixRecommendation> {
  const prompt =
    failure.category === 'security'
      ? buildSecurityFixPrompt(failure)
      : buildBugFixPrompt(failure);

  const rawJson = await callOpenAIWithRetry(prompt);
  const parsed = parseFixJson(rawJson, failure.testId);
  return FixRecommendationSchema.parse(parsed);
}

async function callOpenAIWithRetry(prompt: string): Promise<string> {
  const apiKey = process.env['OPENAI_API_KEY'];
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }

  const client = new OpenAI({ apiKey });
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content:
              'You are a senior software engineer providing fix recommendations. Respond only with valid JSON, no markdown.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.1,
        max_tokens: 1024,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('OpenAI returned empty content');
      return content;
    } catch (err: unknown) {
      lastError = err;
      if (attempt < MAX_RETRIES) await sleep(RETRY_DELAY_MS * attempt);
    }
  }

  throw new Error(
    `OpenAI call failed after ${MAX_RETRIES} attempts: ${String(lastError)}`
  );
}

interface RawFixJson {
  description?: unknown;
  codeSnippet?: unknown;
  affectedFile?: unknown;
  confidence?: unknown;
}

function parseFixJson(
  raw: string,
  testId: string
): {
  testId: string;
  confidence: FixRecommendation['confidence'];
  description: string;
  codeSnippet?: string;
  affectedFile?: string;
} {
  let parsed: RawFixJson;
  try {
    parsed = JSON.parse(raw) as RawFixJson;
  } catch {
    // Fallback if JSON is malformed
    return {
      testId,
      confidence: 'low',
      description: `Could not parse fix recommendation: ${raw.slice(0, 200)}`,
    };
  }

  const confidence = isValidConfidence(parsed.confidence)
    ? parsed.confidence
    : 'low';

  return {
    testId,
    confidence,
    description: typeof parsed.description === 'string' ? parsed.description : 'No description provided',
    codeSnippet: typeof parsed.codeSnippet === 'string' ? parsed.codeSnippet : undefined,
    affectedFile: typeof parsed.affectedFile === 'string' ? parsed.affectedFile : undefined,
  };
}

function isValidConfidence(
  value: unknown
): value is FixRecommendation['confidence'] {
  return value === 'high' || value === 'medium' || value === 'low';
}

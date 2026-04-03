import OpenAI from 'openai';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function callOpenAI(
  prompt: string,
  model = 'gpt-4o'
): Promise<string> {
  const apiKey = process.env['OPENAI_API_KEY'];
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }

  const client = new OpenAI({ apiKey });

  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await client.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content:
              'You are a TypeScript Playwright test generator. Return only valid TypeScript code with no markdown fences or explanation.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
        max_tokens: 4096,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('OpenAI returned empty content');
      }

      // Strip markdown code fences if present
      return content
        .replace(/^```(?:typescript|ts)?\n?/, '')
        .replace(/\n?```$/, '')
        .trim();
    } catch (err: unknown) {
      lastError = err;
      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS * attempt);
      }
    }
  }

  throw new Error(
    `OpenAI call failed after ${MAX_RETRIES} attempts: ${String(lastError)}`
  );
}

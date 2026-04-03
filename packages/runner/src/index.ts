import { randomUUID } from 'node:crypto';
import { executeTests } from './executor.js';
import type { RunResult } from './types.js';

export type { RunResult, RunnerInput } from './types.js';
export { RunResultSchema } from './types.js';

/**
 * Run tests and return [run1Results, run2Results].
 * run2Results contains only the re-run of failed tests from run1.
 * This double-run is required for flakiness detection.
 */
export async function runTests(
  specFiles: string[],
  targetUrl: string
): Promise<[RunResult[], RunResult[]]> {
  const run1Id = randomUUID();
  const run1Results = await executeTests(specFiles, targetUrl, `run1-${run1Id}`);

  // Re-run only failed tests
  const failedFiles = [
    ...new Set(
      run1Results
        .filter((r) => r.status === 'fail' || r.status === 'timeout')
        .map((r) => r.file)
    ),
  ];

  if (failedFiles.length === 0) {
    return [run1Results, []];
  }

  const run2Id = randomUUID();
  const run2Results = await executeTests(failedFiles, targetUrl, `run2-${run2Id}`);

  return [run1Results, run2Results];
}

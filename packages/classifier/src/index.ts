import { classifyCategory, buildEvidence } from './rules.js';
import { ClassifiedFailureSchema } from './types.js';
import type { ClassifiedFailure, RunResultSnapshot } from './types.js';

export type { ClassifiedFailure, RunResultSnapshot } from './types.js';
export { ClassifiedFailureSchema } from './types.js';

/**
 * Classify test failures by comparing run1 vs run2 results.
 * run2 must be the re-run of run1 failures only.
 * RULE: flaky classification requires run2 data — never inferred without it.
 */
export function classifyFailures(
  run1: RunResultSnapshot[],
  run2: RunResultSnapshot[]
): ClassifiedFailure[] {
  // Build lookup map for run2 by testId
  const run2ByTestId = new Map<string, RunResultSnapshot>(
    run2.map((r) => [r.testId, r])
  );

  const classified: ClassifiedFailure[] = [];

  for (const r1 of run1) {
    // Only classify failures
    if (r1.status !== 'fail' && r1.status !== 'timeout') continue;

    const r2 = run2ByTestId.get(r1.testId);
    const category = classifyCategory(r1, r2);
    const evidence = buildEvidence(r1, r2, category);

    const failure = ClassifiedFailureSchema.parse({
      testId: r1.testId,
      file: r1.file,
      title: r1.title,
      category,
      run1ErrorMessage: r1.errorMessage,
      run2ErrorMessage: r2?.errorMessage,
      screenshotPath: r1.screenshotPath ?? r2?.screenshotPath,
      tracePath: r1.tracePath ?? r2?.tracePath,
      evidence,
    });

    classified.push(failure);
  }

  return classified;
}

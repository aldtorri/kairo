import { analyzeProject } from '@kairo/analyzer';
import { generateTests } from '@kairo/generator';
import { runTests } from '@kairo/runner';
import { classifyFailures } from '@kairo/classifier';
import { generateFixes } from '@kairo/fixer';
import type { AnalyzerResult } from '@kairo/analyzer';
import type { GeneratedTest } from '@kairo/generator';
import type { RunResult } from '@kairo/runner';
import type { ClassifiedFailure } from '@kairo/classifier';
import type { FixRecommendation } from '@kairo/fixer';

export interface LoopOptions {
  projectPath: string;
  targetUrl: string;
  maxIterations?: number;
}

export type LoopExitReason =
  | 'all_pass'
  | 'max_iterations'
  | 'only_flaky_or_env'
  | 'app_unresponsive';

export interface IterationResult {
  iteration: number;
  run1: RunResult[];
  run2: RunResult[];
  failures: ClassifiedFailure[];
  fixes: FixRecommendation[];
}

export interface LoopResult {
  analyzerResult: AnalyzerResult;
  generatedTests: GeneratedTest[];
  iterations: IterationResult[];
  exitReason: LoopExitReason;
  totalIterations: number;
}

const DEFAULT_MAX_ITERATIONS = 3;

export async function runLoop(options: LoopOptions): Promise<LoopResult> {
  const { projectPath, targetUrl, maxIterations = DEFAULT_MAX_ITERATIONS } = options;

  // Step 1: Analyze
  const analyzerResult = await analyzeProject(projectPath);

  // Step 2: Generate tests
  const generatedTests = await generateTests({
    analyzerResult,
    targetUrl,
  });

  const specFiles = generatedTests
    .map((t) => t.filePath)
    .filter((p): p is string => p !== undefined);

  const iterations: IterationResult[] = [];
  let currentSpecFiles = specFiles;

  for (let i = 1; i <= maxIterations; i++) {
    // Check app responsiveness before each iteration
    const isResponsive = await checkAppResponsive(targetUrl);
    if (!isResponsive) {
      return {
        analyzerResult,
        generatedTests,
        iterations,
        exitReason: 'app_unresponsive',
        totalIterations: i - 1,
      };
    }

    // Step 3: Run tests
    const [run1, run2] = await runTests(currentSpecFiles, targetUrl);

    // Step 4: Classify failures
    const failures = classifyFailures(run1, run2);

    // Step 5: Generate fixes for actionable failures
    const fixes = await generateFixes(failures);

    iterations.push({ iteration: i, run1, run2, failures, fixes });

    // Exit condition: all tests pass
    const anyFail = run1.some(
      (r) => r.status === 'fail' || r.status === 'timeout'
    );
    if (!anyFail) {
      return {
        analyzerResult,
        generatedTests,
        iterations,
        exitReason: 'all_pass',
        totalIterations: i,
      };
    }

    // Exit condition: only flaky or env failures remain
    const actionableFailures = failures.filter(
      (f) => f.category !== 'flaky' && f.category !== 'env'
    );
    if (actionableFailures.length === 0) {
      return {
        analyzerResult,
        generatedTests,
        iterations,
        exitReason: 'only_flaky_or_env',
        totalIterations: i,
      };
    }

    // Prepare for next iteration: only re-run files with actionable failures
    currentSpecFiles = [
      ...new Set(actionableFailures.map((f) => f.file)),
    ];

    // Max iterations reached
    if (i === maxIterations) {
      return {
        analyzerResult,
        generatedTests,
        iterations,
        exitReason: 'max_iterations',
        totalIterations: i,
      };
    }
  }

  return {
    analyzerResult,
    generatedTests,
    iterations,
    exitReason: 'max_iterations',
    totalIterations: maxIterations,
  };
}

async function checkAppResponsive(targetUrl: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(targetUrl, {
      signal: controller.signal,
      method: 'HEAD',
    });

    clearTimeout(timeout);
    return response.status < 500;
  } catch {
    return false;
  }
}

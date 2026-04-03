import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import type { RunResult } from './types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

function resolvePlaywrightBin(): string {
  const candidates = [
    // pnpm hoisted location (most common in this monorepo)
    join(__dirname, '../../../node_modules/.pnpm/node_modules/.bin/playwright'),
    // local node_modules
    join(__dirname, '../../node_modules/.bin/playwright'),
    // standard npm install
    join(__dirname, '../../../node_modules/.bin/playwright'),
  ];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  // Fall back — let PATH resolve it
  return 'playwright';
}

interface PlaywrightJsonReport {
  suites?: PlaywrightSuite[];
  errors?: Array<{ message: string }>;
}

interface PlaywrightSuite {
  title: string;
  file?: string;
  suites?: PlaywrightSuite[];
  specs?: PlaywrightSpec[];
}

interface PlaywrightSpec {
  title: string;
  file?: string;
  tests?: PlaywrightTest[];
}

interface PlaywrightTest {
  status: string;
  results?: PlaywrightTestResult[];
}

interface PlaywrightTestResult {
  status: string;
  duration: number;
  error?: { message: string };
  attachments?: Array<{ name: string; path?: string; contentType: string }>;
  stdout?: Array<{ text: string }>;
  stderr?: Array<{ text: string }>;
}

export async function executeTests(
  specFiles: string[],
  targetUrl: string,
  runId: string
): Promise<RunResult[]> {
  const outputDir = join(tmpdir(), `kairo-run-${runId}`);
  await mkdir(outputDir, { recursive: true });

  const reportPath = join(outputDir, 'report.json');

  const args = [
    ...specFiles,
    '--reporter=json',
    `--output=${outputDir}/test-results`,
    `--trace=on`,
  ];

  // Use the directory of the first spec file as the playwright root
  // so that Playwright can find the test files relative to its rootDir
  const specDir = dirname(specFiles[0] ?? process.cwd());

  const env: NodeJS.ProcessEnv = {
    ...process.env,
    PLAYWRIGHT_HTML_REPORT: join(outputDir, 'html'),
    BASE_URL: targetUrl,
    CI: 'true',
    PLAYWRIGHT_ROOT: specDir,
  };

  const stdout = await runPlaywright(args, env, reportPath);
  const results = parseJsonReport(stdout, reportPath, specFiles, outputDir);
  return results;
}

function runPlaywright(
  args: string[],
  env: NodeJS.ProcessEnv,
  _reportPath: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    let stdoutData = '';
    let stderrData = '';

    // Resolve playwright binary: prefer local node_modules, fall back to PATH
    const playwrightBin = resolvePlaywrightBin();
    const fullArgs = ['test', ...args];

    const child = spawn(playwrightBin, fullArgs, {
      env,
      shell: false,
      cwd: env['PLAYWRIGHT_ROOT'] ?? process.cwd(),
    });

    child.stdout?.on('data', (chunk: Buffer) => {
      stdoutData += chunk.toString();
    });

    // Playwright JSON reporter writes to stderr by default
    child.stderr?.on('data', (chunk: Buffer) => {
      stderrData += chunk.toString();
    });

    child.on('close', (code) => {
      // Exit code 1 means some tests failed — that's expected, not an error
      if (code !== null && code > 1) {
        reject(
          new Error(
            `Playwright process exited with code ${code}:\n${stderrData}`
          )
        );
        return;
      }
      // JSON reporter outputs to stderr; merge both for parsing
      resolve(stderrData || stdoutData);
    });

    child.on('error', (err) => {
      reject(new Error(`Failed to spawn playwright: ${err.message}`));
    });
  });
}

function parseJsonReport(
  stdout: string,
  _reportPath: string,
  specFiles: string[],
  outputDir: string
): RunResult[] {
  // Try to parse JSON from stdout
  let report: PlaywrightJsonReport | null = null;

  // Playwright JSON reporter writes to stdout
  const jsonMatch = stdout.match(/(\{[\s\S]*\})/);
  if (jsonMatch?.[1]) {
    try {
      report = JSON.parse(jsonMatch[1]) as PlaywrightJsonReport;
    } catch {
      // Failed to parse JSON
    }
  }

  if (!report) {
    // If we can't parse, return a single failure per spec file
    return specFiles.map((file, idx) => ({
      testId: `${idx}-0`,
      file,
      title: `Unknown test in ${file}`,
      status: 'fail' as const,
      duration: 0,
      errorMessage: 'Could not parse Playwright JSON report',
      tracePath: undefined,
      screenshotPath: undefined,
    }));
  }

  return extractResultsFromReport(report, outputDir);
}

function extractResultsFromReport(
  report: PlaywrightJsonReport,
  outputDir: string
): RunResult[] {
  const results: RunResult[] = [];

  function processSpec(
    spec: PlaywrightSpec,
    suiteTitle: string,
    specIdx: number
  ): void {
    const tests = spec.tests ?? [];
    tests.forEach((test, testIdx) => {
      const latestResult = test.results?.[test.results.length - 1];
      const status = mapStatus(test.status);
      const testId = `${specIdx}-${testIdx}`;

      const screenshotAttachment = latestResult?.attachments?.find(
        (a) => a.contentType.startsWith('image/') && a.path
      );
      const traceAttachment = latestResult?.attachments?.find(
        (a) => a.name === 'trace' && a.path
      );

      results.push({
        testId,
        file: spec.file ?? suiteTitle,
        title: `${suiteTitle} > ${spec.title}`,
        status,
        duration: latestResult?.duration ?? 0,
        errorMessage: latestResult?.error?.message,
        screenshotPath: screenshotAttachment?.path,
        tracePath: traceAttachment?.path ?? findTraceFile(outputDir, testId),
        stdout: latestResult?.stdout?.map((s) => s.text).join(''),
        stderr: latestResult?.stderr?.map((s) => s.text).join(''),
      });
    });
  }

  function processSuite(suite: PlaywrightSuite, parentTitle: string, idx: number): void {
    const title = [parentTitle, suite.title].filter(Boolean).join(' > ');
    suite.specs?.forEach((spec, specIdx) => processSpec(spec, title, idx * 1000 + specIdx));
    suite.suites?.forEach((sub, subIdx) => processSuite(sub, title, idx * 100 + subIdx));
  }

  report.suites?.forEach((suite, idx) => processSuite(suite, '', idx));
  return results;
}

function mapStatus(status: string): RunResult['status'] {
  switch (status) {
    case 'passed':
    case 'expected':
      return 'pass';
    case 'timedOut':
      return 'timeout';
    case 'skipped':
      return 'skip';
    default:
      return 'fail';
  }
}

function findTraceFile(outputDir: string, testId: string): string | undefined {
  // Playwright saves traces to test-results/<test-name>/trace.zip
  // Return a predictive path that may exist
  return join(outputDir, 'test-results', testId, 'trace.zip');
}

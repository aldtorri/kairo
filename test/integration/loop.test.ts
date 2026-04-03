import { describe, it, expect } from 'vitest';
import { analyzeProject } from '@kairo/analyzer';
import { classifyFailures } from '@kairo/classifier';
import { generateFixes } from '@kairo/fixer';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const FIXTURE_PATH = join(__dirname, '../fixtures/sample-app');

describe('analyzeProject (integration)', () => {
  it('detects Express stack in sample-app fixture', async () => {
    const result = await analyzeProject(FIXTURE_PATH);

    expect(result.stack.framework).toBe('express');
    expect(result.stack.language).toBe('javascript');
    expect(result.projectPath).toBe(FIXTURE_PATH);
  });

  it('detects endpoints from Express routes', async () => {
    const result = await analyzeProject(FIXTURE_PATH);

    const paths = result.endpoints.map((e) => e.path);
    expect(paths).toContain('/health');
    expect(paths).toContain('/api/items');
    expect(paths).toContain('/api/private');
  });

  it('detects no auth strategy (plain app)', async () => {
    const result = await analyzeProject(FIXTURE_PATH);
    expect(result.authStrategy.type).toBe('none');
  });
});

describe('classifyFailures (unit)', () => {
  it('classifies flaky: fail run1, pass run2', () => {
    const run1 = [
      {
        testId: 't1',
        file: 'test.spec.ts',
        title: 'flaky test',
        status: 'fail' as const,
        duration: 100,
        errorMessage: 'Element not found',
      },
    ];
    const run2 = [
      {
        testId: 't1',
        file: 'test.spec.ts',
        title: 'flaky test',
        status: 'pass' as const,
        duration: 90,
      },
    ];

    const result = classifyFailures(run1, run2);
    expect(result).toHaveLength(1);
    expect(result[0]?.category).toBe('flaky');
  });

  it('classifies bug: fail run1, fail run2', () => {
    const run1 = [
      {
        testId: 't2',
        file: 'test.spec.ts',
        title: 'broken test',
        status: 'fail' as const,
        duration: 100,
        errorMessage: 'Expected 200 but got 404',
      },
    ];
    const run2 = [
      {
        testId: 't2',
        file: 'test.spec.ts',
        title: 'broken test',
        status: 'fail' as const,
        duration: 100,
        errorMessage: 'Expected 200 but got 404',
      },
    ];

    const result = classifyFailures(run1, run2);
    expect(result[0]?.category).toBe('bug');
  });

  it('classifies env: ECONNREFUSED error', () => {
    const run1 = [
      {
        testId: 't3',
        file: 'test.spec.ts',
        title: 'connection test',
        status: 'fail' as const,
        duration: 5000,
        errorMessage: 'connect ECONNREFUSED 127.0.0.1:3000',
      },
    ];

    const result = classifyFailures(run1, []);
    expect(result[0]?.category).toBe('env');
  });

  it('classifies security: 401 unauthorized pattern', () => {
    const run1 = [
      {
        testId: 't4',
        file: 'security.spec.ts',
        title: 'Auth bypass: Expected 401 Unauthorized',
        status: 'fail' as const,
        duration: 200,
        errorMessage: 'Expected status 401 but got 200',
      },
    ];

    const result = classifyFailures(run1, []);
    expect(result[0]?.category).toBe('security');
  });

  it('NEVER classifies flaky without run2 data', () => {
    const run1 = [
      {
        testId: 't5',
        file: 'test.spec.ts',
        title: 'some test',
        status: 'fail' as const,
        duration: 100,
        errorMessage: 'something failed',
      },
    ];

    // Empty run2 — cannot be flaky
    const result = classifyFailures(run1, []);
    expect(result[0]?.category).not.toBe('flaky');
  });
});

describe('generateFixes guard (unit)', () => {
  it('does NOT generate fixes for flaky failures', async () => {
    const failures = [
      {
        testId: 'f1',
        file: 'test.spec.ts',
        title: 'flaky test',
        category: 'flaky' as const,
        evidence: 'Category: flaky',
      },
    ];

    // Should return empty — no OpenAI call needed
    const fixes = await generateFixes(failures);
    expect(fixes).toHaveLength(0);
  });

  it('does NOT generate fixes for env failures', async () => {
    const failures = [
      {
        testId: 'f2',
        file: 'test.spec.ts',
        title: 'env test',
        category: 'env' as const,
        evidence: 'Category: env',
      },
    ];

    const fixes = await generateFixes(failures);
    expect(fixes).toHaveLength(0);
  });
});

import { Router } from 'express';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { getDb } from '../db/schema.js';
import { validate } from '../middleware/validate.js';
import { runLoop } from '@kairo/mcp';
import type { IterationResult } from '@kairo/mcp';
import type { ClassifiedFailure } from '@kairo/classifier';
import type { FixRecommendation } from '@kairo/fixer';

const router = Router();

const CreateRunSchema = z.object({
  projectPath: z.string().min(1),
  targetUrl: z.string().url(),
});

// POST /runs — start a new kairo run
router.post('/', validate(CreateRunSchema), (req, res) => {
  const { projectPath, targetUrl } = req.body as z.infer<typeof CreateRunSchema>;
  const runId = randomUUID();
  const db = getDb();

  db.prepare(
    'INSERT INTO runs (id, project_path, target_url, status) VALUES (?, ?, ?, ?)'
  ).run(runId, projectPath, targetUrl, 'running');

  // Run async — don't await
  void runLoop({ projectPath, targetUrl }).then((result) => {
    db.prepare(
      "UPDATE runs SET status = ?, exit_reason = ?, total_iterations = ?, updated_at = datetime('now') WHERE id = ?"
    ).run('completed', result.exitReason, result.totalIterations, runId);

    result.iterations.forEach((iter: IterationResult) => {
      // Store test results
      [...iter.run1, ...iter.run2].forEach((r) => {
        db.prepare(
          'INSERT INTO test_results (id, run_id, iteration, run_number, test_id, file, title, status, duration, error_message, screenshot_path, trace_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        ).run(
          randomUUID(), runId, iter.iteration,
          iter.run1.includes(r) ? 1 : 2,
          r.testId, r.file, r.title, r.status, r.duration,
          r.errorMessage ?? null, r.screenshotPath ?? null, r.tracePath ?? null
        );
      });

      // Store classifications
      iter.failures.forEach((f: ClassifiedFailure) => {
        db.prepare(
          'INSERT INTO classifications (id, run_id, iteration, test_id, file, title, category, run1_error, run2_error, evidence, screenshot_path, trace_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        ).run(
          randomUUID(), runId, iter.iteration,
          f.testId, f.file, f.title, f.category,
          f.run1ErrorMessage ?? null, f.run2ErrorMessage ?? null,
          f.evidence,
          f.screenshotPath ?? null, f.tracePath ?? null
        );
      });

      // Store fixes
      iter.fixes.forEach((fix: FixRecommendation) => {
        db.prepare(
          'INSERT INTO fixes (id, run_id, iteration, test_id, confidence, description, code_snippet, affected_file) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        ).run(
          randomUUID(), runId, iter.iteration,
          fix.testId, fix.confidence, fix.description,
          fix.codeSnippet ?? null, fix.affectedFile ?? null
        );
      });
    });
  }).catch((err: unknown) => {
    db.prepare(
      "UPDATE runs SET status = ?, updated_at = datetime('now') WHERE id = ?"
    ).run('failed', runId);
    console.error(`[api] Run ${runId} failed:`, err);
  });

  res.status(202).json({ success: true, data: { runId } });
});

// GET /runs — list all runs
router.get('/', (_req, res) => {
  const db = getDb();
  const runs = db.prepare(
    'SELECT id, project_path, target_url, status, exit_reason, total_iterations, created_at, updated_at FROM runs ORDER BY created_at DESC'
  ).all();

  res.json({ success: true, data: runs });
});

// GET /runs/:id — full run detail
router.get('/:id', (req, res) => {
  const db = getDb();
  const { id } = req.params;

  const run = db.prepare('SELECT * FROM runs WHERE id = ?').get(id);
  if (!run) {
    res.status(404).json({ success: false, error: 'Run not found' });
    return;
  }

  const testResults = db.prepare(
    'SELECT * FROM test_results WHERE run_id = ? ORDER BY iteration, run_number, test_id'
  ).all(id);

  const classifications = db.prepare(
    'SELECT * FROM classifications WHERE run_id = ? ORDER BY iteration, test_id'
  ).all(id);

  const fixes = db.prepare(
    'SELECT * FROM fixes WHERE run_id = ? ORDER BY iteration, confidence DESC'
  ).all(id);

  res.json({
    success: true,
    data: { run, testResults, classifications, fixes },
  });
});

export default router;

const BASE_URL = import.meta.env.VITE_API_URL ?? '';

export interface RunSummary {
  id: string;
  project_path: string;
  target_url: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  exit_reason: string | null;
  total_iterations: number;
  created_at: string;
  updated_at: string;
}

export interface TestResult {
  id: string;
  run_id: string;
  iteration: number;
  run_number: number;
  test_id: string;
  file: string;
  title: string;
  status: 'pass' | 'fail' | 'skip' | 'timeout';
  duration: number;
  error_message: string | null;
  screenshot_path: string | null;
  trace_path: string | null;
}

export interface Classification {
  id: string;
  run_id: string;
  iteration: number;
  test_id: string;
  file: string;
  title: string;
  category: 'bug' | 'flaky' | 'env' | 'security';
  run1_error: string | null;
  run2_error: string | null;
  evidence: string | null;
}

export interface Fix {
  id: string;
  run_id: string;
  iteration: number;
  test_id: string;
  confidence: 'high' | 'medium' | 'low';
  description: string;
  code_snippet: string | null;
  affected_file: string | null;
  applied: number;
  dismissed: number;
}

export interface RunDetail {
  run: RunSummary;
  testResults: TestResult[];
  classifications: Classification[];
  fixes: Fix[];
}

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }
  const body = await res.json() as { success: boolean; data: T; error?: string };
  if (!body.success) {
    throw new Error(body.error ?? 'Unknown error');
  }
  return body.data;
}

export async function listRuns(): Promise<RunSummary[]> {
  return fetchJson<RunSummary[]>('/runs');
}

export async function getRun(id: string): Promise<RunDetail> {
  return fetchJson<RunDetail>(`/runs/${id}`);
}

export async function createRun(
  projectPath: string,
  targetUrl: string
): Promise<{ runId: string }> {
  const res = await fetch(`${BASE_URL}/runs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectPath, targetUrl }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const body = await res.json() as { success: boolean; data: { runId: string } };
  return body.data;
}

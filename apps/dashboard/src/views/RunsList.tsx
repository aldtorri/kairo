import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listRuns } from '../api/client.js';
import type { RunSummary } from '../api/client.js';

const STATUS_COLORS: Record<RunSummary['status'], { bg: string; color: string }> = {
  pending:   { bg: '#f1f5f9', color: '#475569' },
  running:   { bg: '#eef2ff', color: '#6366f1' },
  completed: { bg: '#dcfce7', color: '#16a34a' },
  failed:    { bg: '#fee2e2', color: '#dc2626' },
};

function StatusChip({ status }: { status: RunSummary['status'] }) {
  const { bg, color } = STATUS_COLORS[status];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: 500,
        background: bg,
        color,
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      {status}
    </span>
  );
}

export function RunsList() {
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  const PAGE_SIZE = 20;
  const totalPages = Math.max(1, Math.ceil(runs.length / PAGE_SIZE));
  const pageRuns = runs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    void listRuns()
      .then(setRuns)
      .catch((err: unknown) => setError(String(err)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Header */}
      <div
        style={{
          padding: '16px 24px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <h1 style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
            Runs
          </h1>
          {!loading && (
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0' }}>
              {runs.length} total
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '16px 24px' }}>
        {loading && (
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>Loading…</p>
        )}
        {error && (
          <p style={{ color: '#dc2626', fontSize: '14px' }}>Error: {error}</p>
        )}
        {!loading && !error && runs.length === 0 && (
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>No runs yet.</p>
        )}
        {!loading && !error && runs.length > 0 && (
          <>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '13px',
              }}
            >
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  {['ID', 'Project', 'Target URL', 'Status', 'Iterations', 'Created'].map(
                    (h) => (
                      <th
                        key={h}
                        style={{
                          textAlign: 'left',
                          padding: '8px 12px',
                          color: '#94a3b8',
                          fontWeight: 500,
                          fontSize: '12px',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {pageRuns.map((run) => (
                  <tr
                    key={run.id}
                    onClick={() => void navigate(`/runs/${run.id}`)}
                    style={{
                      cursor: 'pointer',
                      borderBottom: '1px solid #f1f5f9',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLTableRowElement).style.background = '#f8fafc';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLTableRowElement).style.background = '';
                    }}
                  >
                    <td
                      style={{
                        padding: '10px 12px',
                        fontFamily: "'JetBrains Mono', monospace",
                        color: '#6366f1',
                        fontSize: '12px',
                      }}
                    >
                      {run.id.slice(0, 8)}
                    </td>
                    <td style={{ padding: '10px 12px', color: '#0f172a' }}>
                      {run.project_path.split('/').at(-1)}
                    </td>
                    <td
                      style={{
                        padding: '10px 12px',
                        color: '#475569',
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '12px',
                      }}
                    >
                      {run.target_url}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <StatusChip status={run.status} />
                    </td>
                    <td
                      style={{
                        padding: '10px 12px',
                        color: '#475569',
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {run.total_iterations}
                    </td>
                    <td style={{ padding: '10px 12px', color: '#94a3b8', fontSize: '12px' }}>
                      {new Date(run.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div
                style={{
                  display: 'flex',
                  gap: '4px',
                  marginTop: '16px',
                  alignItems: 'center',
                }}
              >
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: '1px solid #e2e8f0',
                      background: p === page ? '#6366f1' : '#ffffff',
                      color: p === page ? '#ffffff' : '#475569',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getRun } from '../api/client.js';
import type { Fix } from '../api/client.js';

const CONFIDENCE_STYLE: Record<Fix['confidence'], { bg: string; color: string; label: string }> = {
  high:   { bg: '#eef2ff', color: '#6366f1', label: 'high' },
  medium: { bg: '#fef3c7', color: '#d97706', label: 'medium' },
  low:    { bg: '#fee2e2', color: '#dc2626', label: 'low' },
};

const CONFIDENCE_ORDER: Fix['confidence'][] = ['high', 'medium', 'low'];

const APPLIED_KEY = (id: string) => `kairo:fix:applied:${id}`;
const DISMISSED_KEY = (id: string) => `kairo:fix:dismissed:${id}`;

function FixCard({ fix }: { fix: Fix }) {
  const [applied, setApplied] = useState(
    () => localStorage.getItem(APPLIED_KEY(fix.id)) === '1'
  );
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISSED_KEY(fix.id)) === '1'
  );

  const conf = CONFIDENCE_STYLE[fix.confidence];

  if (dismissed) return null;

  return (
    <div
      style={{
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '16px',
        background: applied ? '#f8fafc' : '#ffffff',
        opacity: applied ? 0.7 : 1,
        transition: 'opacity 0.15s',
      }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 500,
            background: conf.bg,
            color: conf.color,
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {conf.label}
        </span>
        <span
          style={{
            fontSize: '11px',
            color: '#94a3b8',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {fix.test_id}
        </span>
        {applied && (
          <span
            style={{
              fontSize: '11px',
              color: '#16a34a',
              fontWeight: 500,
            }}
          >
            ✓ Applied
          </span>
        )}
      </div>

      {/* Description */}
      <p style={{ fontSize: '13px', color: '#0f172a', margin: '0 0 8px', lineHeight: 1.6 }}>
        {fix.description}
      </p>

      {/* Affected file */}
      {fix.affected_file && (
        <p
          style={{
            fontSize: '12px',
            color: '#6366f1',
            fontFamily: "'JetBrains Mono', monospace",
            margin: '0 0 8px',
          }}
        >
          {fix.affected_file}
        </p>
      )}

      {/* Code snippet */}
      {fix.code_snippet && (
        <pre
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            padding: '12px',
            fontSize: '12px',
            fontFamily: "'JetBrains Mono', monospace",
            color: '#0f172a',
            overflow: 'auto',
            margin: '0 0 12px',
            lineHeight: 1.6,
          }}
        >
          {fix.code_snippet}
        </pre>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => {
            const next = !applied;
            setApplied(next);
            if (next) {
              localStorage.setItem(APPLIED_KEY(fix.id), '1');
            } else {
              localStorage.removeItem(APPLIED_KEY(fix.id));
            }
          }}
          style={{
            padding: '5px 12px',
            borderRadius: '5px',
            border: '1px solid #e2e8f0',
            background: applied ? '#dcfce7' : '#ffffff',
            color: applied ? '#16a34a' : '#475569',
            fontSize: '12px',
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          {applied ? 'Undo applied' : 'Mark applied'}
        </button>
        <button
          onClick={() => {
            setDismissed(true);
            localStorage.setItem(DISMISSED_KEY(fix.id), '1');
          }}
          style={{
            padding: '5px 12px',
            borderRadius: '5px',
            border: '1px solid #e2e8f0',
            background: '#ffffff',
            color: '#94a3b8',
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

export function Fixes() {
  const { id } = useParams<{ id: string }>();
  const [fixes, setFixes] = useState<Fix[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    void getRun(id)
      .then((data) => {
        // Sort by confidence: high → medium → low
        const sorted = [...data.fixes].sort(
          (a, b) =>
            CONFIDENCE_ORDER.indexOf(a.confidence) -
            CONFIDENCE_ORDER.indexOf(b.confidence)
        );
        setFixes(sorted);
      })
      .catch((err: unknown) => setError(String(err)))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div>
      {/* Header */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <Link to="/" style={{ color: '#94a3b8', fontSize: '13px', textDecoration: 'none' }}>
            Runs
          </Link>
          <span style={{ color: '#94a3b8' }}>/</span>
          <Link
            to={`/runs/${id}`}
            style={{
              color: '#6366f1',
              fontSize: '13px',
              textDecoration: 'none',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {id?.slice(0, 8)}
          </Link>
          <span style={{ color: '#94a3b8' }}>/</span>
          <span style={{ fontSize: '13px', color: '#0f172a' }}>Fixes</span>
        </div>
        <h1 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>
          Fix Recommendations
          {!loading && (
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 400, marginLeft: '8px' }}>
              {fixes.length} total
            </span>
          )}
        </h1>
      </div>

      <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {loading && <p style={{ color: '#94a3b8' }}>Loading…</p>}
        {error && <p style={{ color: '#dc2626' }}>Error: {error}</p>}
        {!loading && !error && fixes.length === 0 && (
          <p style={{ color: '#94a3b8', fontSize: '13px' }}>No fix recommendations for this run.</p>
        )}
        {fixes.map((fix) => (
          <FixCard key={fix.id} fix={fix} />
        ))}
      </div>
    </div>
  );
}

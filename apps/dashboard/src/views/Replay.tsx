import { useParams, useSearchParams, Link } from 'react-router-dom';

export function Replay() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const tracePath = searchParams.get('trace');

  // Playwright trace viewer is served from the API or a static path
  const traceViewerUrl = tracePath
    ? `/trace/index.html?trace=${encodeURIComponent(tracePath)}`
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '12px 24px', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
          <span style={{ fontSize: '13px', color: '#0f172a' }}>Replay</span>
        </div>
      </div>

      {/* iframe */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {traceViewerUrl ? (
          <iframe
            src={traceViewerUrl}
            style={{ width: '100%', height: '100%', border: 'none' }}
            title="Playwright Trace Viewer"
          />
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: '#94a3b8',
              fontSize: '14px',
            }}
          >
            No trace selected. Click a trace link from the run detail view.
          </div>
        )}
      </div>
    </div>
  );
}

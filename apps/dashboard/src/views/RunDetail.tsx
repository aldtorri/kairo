import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getRun } from '../api/client.js';
import type { RunDetail as RunDetailData, TestResult } from '../api/client.js';

type Tab = 'frontend' | 'backend' | 'security';

const CATEGORY_COLORS: Record<string, { bg: string; color: string }> = {
  bug:      { bg: '#fee2e2', color: '#dc2626' },
  flaky:    { bg: '#fef3c7', color: '#d97706' },
  env:      { bg: '#f1f5f9', color: '#475569' },
  security: { bg: '#ede9fe', color: '#7c3aed' },
};

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  pass:    { bg: '#dcfce7', color: '#16a34a' },
  fail:    { bg: '#fee2e2', color: '#dc2626' },
  skip:    { bg: '#f1f5f9', color: '#94a3b8' },
  timeout: { bg: '#fef3c7', color: '#d97706' },
};

function Chip({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: '4px',
        fontSize: '11px',
        fontWeight: 500,
        background: bg,
        color,
        fontFamily: "'JetBrains Mono', monospace",
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}

function filterTestsByTab(tests: TestResult[], tab: Tab): TestResult[] {
  return tests.filter((t) => {
    const lower = t.file.toLowerCase();
    if (tab === 'frontend') return lower.includes('frontend');
    if (tab === 'backend') return lower.includes('backend');
    if (tab === 'security') return lower.includes('security');
    return true;
  });
}

export function RunDetail() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<RunDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('frontend');

  useEffect(() => {
    if (!id) return;
    void getRun(id)
      .then(setData)
      .catch((err: unknown) => setError(String(err)))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={{ padding: 24, color: '#94a3b8' }}>Loading…</div>;
  if (error) return <div style={{ padding: 24, color: '#dc2626' }}>Error: {error}</div>;
  if (!data) return null;

  const { run, testResults, classifications } = data;
  const passed = testResults.filter((t) => t.status === 'pass').length;
  const failed = testResults.filter((t) => t.status === 'fail').length;
  const totalDuration = testResults.reduce((acc, t) => acc + t.duration, 0);
  const passRate = testResults.length > 0 ? Math.round((passed / testResults.length) * 100) : 0;

  const tabTests = filterTestsByTab(testResults, activeTab);
  const tabs: Tab[] = ['frontend', 'backend', 'security'];

  return (
    <div>
      {/* Header */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <Link
            to="/"
            style={{ color: '#94a3b8', fontSize: '13px', textDecoration: 'none' }}
          >
            Runs
          </Link>
          <span style={{ color: '#94a3b8' }}>/</span>
          <span
            style={{
              fontSize: '13px',
              color: '#6366f1',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {run.id.slice(0, 8)}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>
            {run.project_path.split('/').at(-1)}
          </h1>
          <span
            style={{
              fontSize: '12px',
              color: '#475569',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {run.target_url}
          </span>
        </div>
      </div>

      <div style={{ padding: '16px 24px' }}>
        {/* Metric cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
          {[
            { label: 'Total', value: testResults.length, mono: true },
            { label: 'Passed', value: passed, color: '#16a34a', mono: true },
            { label: 'Failed', value: failed, color: '#dc2626', mono: true },
            { label: 'Duration', value: `${(totalDuration / 1000).toFixed(1)}s`, mono: true },
          ].map(({ label, value, color, mono }) => (
            <div
              key={label}
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '12px 16px',
              }}
            >
              <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 4px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {label}
              </p>
              <p
                style={{
                  fontSize: '22px',
                  fontWeight: 600,
                  margin: 0,
                  color: color ?? '#0f172a',
                  fontFamily: mono ? "'JetBrains Mono', monospace" : undefined,
                }}
              >
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Pass rate progress bar */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '12px', color: '#475569' }}>Pass rate</span>
            <span style={{ fontSize: '12px', color: '#475569', fontFamily: "'JetBrains Mono', monospace" }}>
              {passRate}%
            </span>
          </div>
          <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${passRate}%`,
                background: passRate === 100 ? '#16a34a' : passRate > 50 ? '#6366f1' : '#dc2626',
                borderRadius: '3px',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          <Link
            to={`/runs/${id}/fixes`}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              color: '#475569',
              fontSize: '13px',
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            View Fixes
          </Link>
        </div>

        {/* Tabs */}
        <div style={{ borderBottom: '1px solid #e2e8f0', marginBottom: '16px', display: 'flex', gap: '0' }}>
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderBottom: activeTab === tab ? '2px solid #6366f1' : '2px solid transparent',
                background: 'transparent',
                color: activeTab === tab ? '#6366f1' : '#475569',
                fontSize: '13px',
                fontWeight: activeTab === tab ? 600 : 400,
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Test list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {tabTests.length === 0 && (
            <p style={{ color: '#94a3b8', fontSize: '13px' }}>No tests in this category.</p>
          )}
          {tabTests.map((test) => {
            const sc = STATUS_COLORS[test.status] ?? STATUS_COLORS['fail'];
            const classification = classifications.find(
              (c) => c.test_id === test.test_id
            );
            const cc = classification
              ? (CATEGORY_COLORS[classification.category] ?? CATEGORY_COLORS['bug'])
              : null;

            return (
              <div
                key={test.id}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      margin: '0 0 4px',
                      fontSize: '13px',
                      color: '#0f172a',
                      fontWeight: 500,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {test.title}
                  </p>
                  {test.error_message && (
                    <p
                      style={{
                        margin: 0,
                        fontSize: '12px',
                        color: '#dc2626',
                        fontFamily: "'JetBrains Mono', monospace",
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {test.error_message.slice(0, 120)}
                    </p>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
                  {cc && classification && (
                    <Chip label={classification.category} bg={cc.bg} color={cc.color} />
                  )}
                  <Chip label={test.status} bg={sc.bg} color={sc.color} />
                  {test.trace_path && (
                    <Link
                      to={`/runs/${id}/replay?trace=${encodeURIComponent(test.trace_path)}`}
                      style={{ fontSize: '12px', color: '#6366f1', textDecoration: 'none' }}
                    >
                      Trace
                    </Link>
                  )}
                  <span
                    style={{
                      fontSize: '11px',
                      color: '#94a3b8',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {test.duration}ms
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

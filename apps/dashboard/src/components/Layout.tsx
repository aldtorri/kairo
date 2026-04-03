import { NavLink, Outlet } from 'react-router-dom';

export function Layout() {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: '240px',
          flexShrink: 0,
          background: '#f8fafc',
          borderRight: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          padding: '16px 0',
        }}
      >
        {/* Logo */}
        <div
          style={{
            padding: '0 16px 16px',
            borderBottom: '1px solid #e2e8f0',
            marginBottom: '8px',
          }}
        >
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 600,
              fontSize: '15px',
              color: '#6366f1',
              letterSpacing: '-0.5px',
            }}
          >
            kairo
          </span>
        </div>

        {/* Nav */}
        <nav style={{ padding: '0 8px' }}>
          <NavLink
            to="/"
            end
            style={({ isActive }) => ({
              display: 'block',
              padding: '6px 8px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 500,
              color: isActive ? '#6366f1' : '#475569',
              background: isActive ? '#eef2ff' : 'transparent',
              textDecoration: 'none',
              transition: 'background 0.1s, color 0.1s',
            })}
          >
            Runs
          </NavLink>
        </nav>
      </aside>

      {/* Main content */}
      <main
        style={{
          flex: 1,
          overflow: 'auto',
          background: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Outlet />
      </main>
    </div>
  );
}

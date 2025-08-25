import * as React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

type NavItem = {
  label: string;
  to: string;
  exact?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard', exact: true },
  { label: 'Team Tasks', to: '/team-tasks' },
  { label: 'Reviews', to: '/reviews' },
  { label: 'Newsletter', to: '/newsletter' },
  { label: 'Upload', to: '/upload' },
  { label: 'Settings', to: '/settings' },
];

function Sidebar() {
  return (
    <aside
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: 240,
        height: '100vh',
        borderRight: '1px solid #e5e7eb',
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        background: '#ffffff',
        zIndex: 10,
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8, color: '#111827' }}>
        App Menu
      </div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            style={({ isActive }) => ({
              padding: '12px 16px',
              borderRadius: 8,
              textDecoration: 'none',
              color: isActive ? '#111827' : '#374151',
              background: isActive ? '#e5e7eb' : 'transparent',
              fontWeight: isActive ? 600 : 400,
              transition: 'all 0.2s ease',
              border: 'none',
              cursor: 'pointer',
            })}
            onMouseEnter={(e) => {
              if (!e.currentTarget.classList.contains('active')) {
                e.currentTarget.style.background = '#f3f4f6';
              }
            }}
            onMouseLeave={(e) => {
              if (!e.currentTarget.classList.contains('active')) {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default function Layout() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      {/* Fixed sidebar */}
      <Sidebar />

      {/* Main content area with margin to account for fixed sidebar */}
      <div style={{ marginLeft: 240, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header
          style={{
            position: 'sticky',
            top: 0,
            padding: '16px 24px',
            borderBottom: '1px solid #e5e7eb',
            background: '#ffffff',
            zIndex: 5,
          }}
        >
          <div style={{ fontWeight: 600, color: '#111827' }}>Welcome</div>
        </header>

        <main style={{ padding: 24, flex: 1 }}>
          {/* CRITICAL: Render nested routes here */}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
'use client';

import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { colors, spacing, typography, borderRadius, shadows } from '../styles/theme';
import { clearTokens, apiClient } from '../services/api';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

const bookingNavItems: NavItem[] = [
  {
    path: '/rooms',
    label: 'Find Rooms',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
      </svg>
    ),
  },
  {
    path: '/floor-map',
    label: 'Floor Map',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18" />
        <path d="M9 21V9" />
      </svg>
    ),
  },
];

const adminNavItems: NavItem[] = [
  {
    path: '/admin/dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    path: '/admin/utilization',
    label: 'Utilization',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 3v18h18" />
        <path d="M18 17V9" />
        <path d="M13 17V5" />
        <path d="M8 17v-3" />
      </svg>
    ),
  },
  {
    path: '/admin/ghosting',
    label: 'Ghosting',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4" />
        <path d="M12 16h.01" />
      </svg>
    ),
  },
  {
    path: '/admin/capacity',
    label: 'Capacity',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
];

export const Layout: React.FC = () => {
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    apiClient.get<{ name: string; role: string; email: string }>('/auth/me')
      .then((res) => setUser(res.data))
      .catch(() => setUser(null));
  }, []);

  const userInitials = user
    ? user.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : '??';
  const userName = user?.name ?? 'Loading...';
  const userRole = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : '';

  const layoutStyle: React.CSSProperties = {
    display: 'flex',
    minHeight: '100vh',
  };

  const sidebarStyle: React.CSSProperties = {
    width: sidebarCollapsed ? '72px' : '260px',
    backgroundColor: colors.background,
    borderRight: `1px solid ${colors.border}`,
    display: 'flex',
    flexDirection: 'column',
    transition: 'width 0.2s ease',
  };

  const logoContainerStyle: React.CSSProperties = {
    padding: `${spacing.md} ${spacing.lg}`,
    borderBottom: `1px solid ${colors.border}`,
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    height: '72px',
    boxSizing: 'border-box',
    justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
  };

  const logoStyle: React.CSSProperties = {
    width: '40px',
    height: '40px',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  };

  const logoTextStyle: React.CSSProperties = {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    display: sidebarCollapsed ? 'none' : 'block',
  };

  const navSectionStyle: React.CSSProperties = {
    padding: sidebarCollapsed ? `${spacing.lg} ${spacing.sm}` : `${spacing.lg} ${spacing.md}`,
  };

  const navLabelStyle: React.CSSProperties = {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: spacing.sm,
    paddingLeft: spacing.sm,
    display: sidebarCollapsed ? 'none' : 'block',
  };

  const navItemStyle = (isActive: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
    gap: sidebarCollapsed ? '0' : spacing.sm,
    padding: sidebarCollapsed ? spacing.sm : `${spacing.sm} ${spacing.md}`,
    borderRadius: borderRadius.md,
    color: isActive ? colors.primary : colors.textSecondary,
    backgroundColor: isActive ? colors.primaryLight : 'transparent',
    textDecoration: 'none',
    fontSize: typography.fontSize.sm,
    fontWeight: isActive ? typography.fontWeight.medium : typography.fontWeight.normal,
    marginBottom: spacing.xs,
    transition: 'background-color 0.2s ease, color 0.2s ease',
  });

  const mainStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: colors.backgroundSecondary,
    overflow: 'auto',
  };

  const headerStyle: React.CSSProperties = {
    backgroundColor: colors.background,
    borderBottom: `1px solid ${colors.border}`,
    padding: `${spacing.md} ${spacing.lg}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '72px',
    boxSizing: 'border-box',
  };

  const toggleButtonStyle: React.CSSProperties = {
    padding: spacing.sm,
    backgroundColor: 'transparent',
    border: 'none',
    color: colors.textSecondary,
    cursor: 'pointer',
    borderRadius: borderRadius.sm,
  };

  const userInfoStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
  };

  const avatarStyle: React.CSSProperties = {
    width: '36px',
    height: '36px',
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: colors.background,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  };

  const contentStyle: React.CSSProperties = {
    flex: 1,
    overflow: 'auto',
  };

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <div style={layoutStyle}>
      <aside style={sidebarStyle}>
        <div style={logoContainerStyle}>
          <div style={logoStyle}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18" />
              <path d="M9 21V9" />
            </svg>
          </div>
          <span style={logoTextStyle}>MeetingRooms</span>
        </div>

        <nav style={{ flex: 1 }}>
          <div style={navSectionStyle}>
            <p style={navLabelStyle}>Booking</p>
            {bookingNavItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                style={navItemStyle(isActive(item.path))}
              >
                {item.icon}
                {!sidebarCollapsed && <span>{item.label}</span>}
              </Link>
            ))}
          </div>

          <div style={navSectionStyle}>
            <p style={navLabelStyle}>Admin</p>
            {adminNavItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                style={navItemStyle(isActive(item.path))}
              >
                {item.icon}
                {!sidebarCollapsed && <span>{item.label}</span>}
              </Link>
            ))}
          </div>
        </nav>

        <div style={{ padding: spacing.md, borderTop: `1px solid ${colors.border}` }}>
          <button
            type="button"
            style={toggleButtonStyle}
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {sidebarCollapsed ? (
                <path d="M9 18l6-6-6-6" />
              ) : (
                <path d="M15 18l-6-6 6-6" />
              )}
            </svg>
          </button>
        </div>
      </aside>

      <main style={mainStyle}>
        <header style={headerStyle}>
          <div>
            {/* Breadcrumb or page title could go here */}
          </div>
          <div style={userInfoStyle}>
            <div style={avatarStyle}>{userInitials}</div>
            {!sidebarCollapsed && (
              <div>
                <p style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, color: colors.text }}>
                  {userName}
                </p>
                <p style={{ fontSize: typography.fontSize.xs, color: colors.textSecondary }}>
                  {userRole}
                </p>
              </div>
            )}
            <button
              type="button"
              onClick={() => { clearTokens(); window.location.href = '/login'; }}
              style={{
                marginLeft: spacing.md,
                padding: `${spacing.xs} ${spacing.md}`,
                backgroundColor: 'transparent',
                border: `1px solid ${colors.border}`,
                borderRadius: borderRadius.md,
                color: colors.textSecondary,
                fontSize: typography.fontSize.sm,
                cursor: 'pointer',
              }}
            >
              Logout
            </button>
          </div>
        </header>

        <div style={contentStyle}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;

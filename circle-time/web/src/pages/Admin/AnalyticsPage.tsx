import React, { useState } from 'react';
import { Dashboard } from './Dashboard';
import { UtilizationView } from './UtilizationView';
import { GhostingView } from './GhostingView';
import { CapacityView } from './CapacityView';
import { colors, spacing, typography, borderRadius } from '../../styles/theme';

// ── Tab definitions ───────────────────────────────────────────────────────────

type TabKey = 'dashboard' | 'utilization' | 'ghosting' | 'capacity';

interface Tab {
  key: TabKey;
  label: string;
}

const TABS: Tab[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'utilization', label: 'Utilization' },
  { key: 'ghosting', label: 'Ghosting' },
  { key: 'capacity', label: 'Capacity' },
];

// ── Component ─────────────────────────────────────────────────────────────────

export const AnalyticsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');

  // ── Styles ──────────────────────────────────────────────────────────────────

  const tabBarStyle: React.CSSProperties = {
    display: 'flex',
    gap: spacing.xs,
    borderBottom: `1px solid ${colors.border}`,
    backgroundColor: colors.background,
    padding: `0 ${spacing.lg}`,
    position: 'sticky',
    top: 0,
    zIndex: 10,
  };

  const tabStyle = (isActive: boolean): React.CSSProperties => ({
    padding: `${spacing.md} ${spacing.lg}`,
    fontSize: typography.fontSize.sm,
    fontWeight: isActive ? typography.fontWeight.semibold : typography.fontWeight.normal,
    color: isActive ? colors.primary : colors.textSecondary,
    background: 'none',
    border: 'none',
    borderBottom: isActive ? `2px solid ${colors.primary}` : '2px solid transparent',
    cursor: 'pointer',
    borderRadius: 0,
    transition: 'color 0.15s ease, border-color 0.15s ease',
    marginBottom: '-1px',
  });

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div>
      <div style={tabBarStyle}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            style={tabStyle(activeTab === tab.key)}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div>
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'utilization' && <UtilizationView />}
        {activeTab === 'ghosting' && <GhostingView />}
        {activeTab === 'capacity' && <CapacityView />}
      </div>
    </div>
  );
};

export default AnalyticsPage;

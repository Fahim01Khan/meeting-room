import React from 'react';
import { colors, spacing, typography, borderRadius, shadows } from '../styles/theme';
import type { KPIData } from '../types/analytics';

interface KPIStatProps {
  data: KPIData;
}

export const KPIStat: React.FC<KPIStatProps> = ({ data }) => {
  const cardStyle: React.CSSProperties = {
    backgroundColor: colors.background,
    border: `1px solid ${colors.border}`,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    boxShadow: shadows.sm,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  };

  const valueContainerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'baseline',
    gap: spacing.xs,
  };

  const valueStyle: React.CSSProperties = {
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    lineHeight: typography.lineHeight.tight,
  };

  const unitStyle: React.CSSProperties = {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  };

  const getChangeColor = () => {
    if (!data.changeType) return colors.textSecondary;
    switch (data.changeType) {
      case 'positive':
        return colors.success;
      case 'negative':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const changeStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    fontSize: typography.fontSize.sm,
    color: getChangeColor(),
  };

  const getChangeIcon = () => {
    if (data.change === undefined || data.change === 0) return null;
    if (data.change > 0) {
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 15l-6-6-6 6" />
        </svg>
      );
    }
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 9l6 6 6-6" />
      </svg>
    );
  };

  return (
    <div style={cardStyle}>
      <p style={labelStyle}>{data.label}</p>
      <div style={valueContainerStyle}>
        <span style={valueStyle}>{data.value}</span>
        {data.unit && <span style={unitStyle}>{data.unit}</span>}
      </div>
      {data.change !== undefined && (
        <div style={changeStyle}>
          {getChangeIcon()}
          <span>
            {Math.abs(data.change)}% vs last period
          </span>
        </div>
      )}
    </div>
  );
};

export default KPIStat;

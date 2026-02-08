import React from 'react';
import { colors, spacing, typography } from '../styles/theme';

interface LoadingStateProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  size = 'medium',
}) => {
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  };

  const spinnerSizes = {
    small: 24,
    medium: 40,
    large: 56,
  };

  const spinnerSize = spinnerSizes[size];

  const spinnerStyle: React.CSSProperties = {
    width: spinnerSize,
    height: spinnerSize,
    border: `3px solid ${colors.border}`,
    borderTopColor: colors.primary,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  };

  const messageStyle: React.CSSProperties = {
    marginTop: spacing.md,
    fontSize: size === 'small' ? typography.fontSize.sm : typography.fontSize.base,
    color: colors.textSecondary,
  };

  return (
    <div style={containerStyle}>
      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
      <div style={spinnerStyle} />
      {message && <p style={messageStyle}>{message}</p>}
    </div>
  );
};

export default LoadingState;

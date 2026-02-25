'use client';

import React, { useState } from 'react';
import { colors, spacing, typography, borderRadius, shadows } from '../styles/theme';

interface LoginProps {
  onLogin?: (email: string, password: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundSecondary,
    padding: spacing.lg,
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    boxShadow: shadows.lg,
    padding: spacing.xxl,
    width: '100%',
    maxWidth: '400px',
  };

  const logoStyle: React.CSSProperties = {
    textAlign: 'center',
    marginBottom: spacing.xl,
  };

  const logoIconStyle: React.CSSProperties = {
    width: '48px',
    height: '48px',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto',
    marginBottom: spacing.md,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  };

  const formStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
  };

  const inputGroupStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
  };

  const inputStyle: React.CSSProperties = {
    padding: `${spacing.sm} ${spacing.md}`,
    border: `1px solid ${colors.border}`,
    borderRadius: borderRadius.md,
    fontSize: typography.fontSize.base,
    color: colors.text,
    outline: 'none',
    transition: 'border-color 0.2s ease',
  };

  const buttonStyle: React.CSSProperties = {
    padding: `${spacing.md} ${spacing.lg}`,
    backgroundColor: colors.primary,
    color: colors.background,
    border: 'none',
    borderRadius: borderRadius.md,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  };

  const errorStyle: React.CSSProperties = {
    padding: spacing.md,
    backgroundColor: colors.errorLight,
    color: colors.error,
    borderRadius: borderRadius.md,
    fontSize: typography.fontSize.sm,
  };

  const linkStyle: React.CSSProperties = {
    textAlign: 'center',
    marginTop: spacing.lg,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    try {
      const { apiClient, setTokens } = await import('../services/api');
      const res = await apiClient.post<{ access: string; refresh: string; user: { id: string; name: string; email: string } }>(
        '/auth/login',
        { email, password },
      );
      setTokens(res.data.access, res.data.refresh);
      // Navigate to main app
      window.location.href = '/';
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setError(msg);
    }
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={logoStyle}>
          <div style={logoIconStyle}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18" />
              <path d="M9 21V9" />
            </svg>
          </div>
          <h1 style={titleStyle}>Meeting Rooms</h1>
          <p style={subtitleStyle}>Sign in to manage your bookings</p>
        </div>

        <form style={formStyle} onSubmit={handleSubmit}>
          {error && <div style={errorStyle}>{error}</div>}

          <div style={inputGroupStyle}>
            <label style={labelStyle} htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              style={inputStyle}
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div style={inputGroupStyle}>
            <label style={labelStyle} htmlFor="password">
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                style={{ ...inputStyle, width: '100%', paddingRight: '40px', boxSizing: 'border-box' }}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: spacing.xs,
                  color: colors.textSecondary,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button type="submit" style={buttonStyle}>
            Sign In
          </button>
        </form>

        <div style={linkStyle}>
          <a
            href="#forgot"
            style={{
              color: colors.primary,
              fontSize: typography.fontSize.sm,
              textDecoration: 'none',
            }}
          >
            Forgot your password?
          </a>
        </div>
      </div>
    </div>
  );
};

export default Login;

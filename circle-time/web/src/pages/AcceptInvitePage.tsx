import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { validateInviteToken, acceptInvite } from '../services/users';
import { ApiClientError } from '../services/api';
import { colors, spacing, typography, borderRadius, shadows } from '../styles/theme';

export const AcceptInvitePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  // Validation state
  const [isValidating, setIsValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setIsValidating(false);
      setValidationError('No invitation token provided.');
      return;
    }

    (async () => {
      try {
        const data = await validateInviteToken(token);
        setEmail(data.email);
        setRole(data.role);
        setTokenValid(true);
      } catch (err) {
        if (err instanceof ApiClientError) {
          setValidationError(err.message);
        } else {
          setValidationError('Unable to validate invitation. Please try again.');
        }
      } finally {
        setIsValidating(false);
      }
    })();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Full name is required.');
      return;
    }
    if (password.length < 8) {
      setFormError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await acceptInvite({ token, name: name.trim(), password });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setFormError(err.message);
      } else {
        setFormError('Something went wrong — please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Styles ──────────────────────────────────────────────────────────────

  const pageStyle: React.CSSProperties = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundSecondary,
    padding: spacing.xl,
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.xxl,
    width: '440px',
    boxShadow: shadows.lg,
  };

  const logoStyle: React.CSSProperties = {
    width: '48px',
    height: '48px',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
    marginTop: 0,
  };

  const subtextStyle: React.CSSProperties = {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
    marginBottom: spacing.sm,
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: `${spacing.md} ${spacing.md}`,
    border: `1px solid ${colors.border}`,
    borderRadius: borderRadius.md,
    fontSize: typography.fontSize.base,
    color: colors.text,
    boxSizing: 'border-box',
    outline: 'none',
    backgroundColor: colors.background,
  };

  const fieldStyle: React.CSSProperties = {
    marginBottom: spacing.lg,
  };

  const submitBtn: React.CSSProperties = {
    width: '100%',
    padding: `${spacing.md} ${spacing.xl}`,
    backgroundColor: isSubmitting ? colors.primaryLight : colors.primary,
    color: colors.background,
    border: 'none',
    borderRadius: borderRadius.md,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    cursor: isSubmitting ? 'not-allowed' : 'pointer',
    marginTop: spacing.md,
  };

  const errorBox: React.CSSProperties = {
    backgroundColor: colors.errorLight,
    color: colors.error,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    fontSize: typography.fontSize.sm,
  };

  const successBox: React.CSSProperties = {
    backgroundColor: colors.successLight,
    color: colors.success,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  };

  const linkStyle: React.CSSProperties = {
    color: colors.primary,
    textDecoration: 'none',
    fontWeight: typography.fontWeight.medium,
  };

  // ── Loading state ──────────────────────────────────────────────────────

  if (isValidating) {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <p style={{ textAlign: 'center', color: colors.textSecondary }}>Validating invitation…</p>
        </div>
      </div>
    );
  }

  // ── Invalid / expired token ────────────────────────────────────────────

  if (!tokenValid) {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <div style={logoStyle}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4" />
              <path d="M12 16h.01" />
            </svg>
          </div>
          <h1 style={titleStyle}>Invalid Invitation</h1>
          <p style={subtextStyle}>
            {validationError || 'This invitation link is invalid or has expired.'}
          </p>
          <a href="/login" style={linkStyle}>← Go to login</a>
        </div>
      </div>
    );
  }

  // ── Success state ──────────────────────────────────────────────────────

  if (success) {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <div style={successBox}>
            ✓ Account created! Redirecting to login…
          </div>
        </div>
      </div>
    );
  }

  // ── Setup form ─────────────────────────────────────────────────────────

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div style={logoStyle}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M8 14s1.5 2 4 2 4-2 4-2" />
            <line x1="9" y1="9" x2="9.01" y2="9" />
            <line x1="15" y1="9" x2="15.01" y2="9" />
          </svg>
        </div>

        <h1 style={titleStyle}>Set Up Your Account</h1>
        <p style={subtextStyle}>
          You've been invited as <strong>{role}</strong> for <strong>{email}</strong>
        </p>

        {formError && <div style={errorBox}>{formError}</div>}

        <form onSubmit={handleSubmit}>
          <div style={fieldStyle}>
            <label htmlFor="acc-name" style={labelStyle}>Full Name *</label>
            <input
              id="acc-name"
              type="text"
              placeholder="Your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={inputStyle}
              required
            />
          </div>

          <div style={fieldStyle}>
            <label htmlFor="acc-password" style={labelStyle}>Password * (min 8 characters)</label>
            <input
              id="acc-password"
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
              required
              minLength={8}
            />
          </div>

          <div style={fieldStyle}>
            <label htmlFor="acc-confirm" style={labelStyle}>Confirm Password *</label>
            <input
              id="acc-confirm"
              type="password"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={inputStyle}
              required
            />
          </div>

          <button type="submit" style={submitBtn} disabled={isSubmitting}>
            {isSubmitting ? 'Creating Account…' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AcceptInvitePage;

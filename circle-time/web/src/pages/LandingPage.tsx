import React from 'react';
import { useNavigate } from 'react-router-dom';
import { colors } from '../styles/theme';

const PRIMARY = colors.primary;
const PRIMARY_HOVER = colors.primaryHover;

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  // ── Styles ──────────────────────────────────────────────────────────────

  const navStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 40px',
    height: '64px',
    backgroundColor: '#FFFFFF',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    zIndex: 100,
  };

  const navLogoWrap: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  };

  const navLogoBox: React.CSSProperties = {
    width: '32px',
    height: '32px',
    backgroundColor: PRIMARY,
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const navTitle: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: 700,
    color: '#111827',
    letterSpacing: '-0.01em',
  };

  const navSignIn: React.CSSProperties = {
    padding: '8px 20px',
    border: `2px solid ${PRIMARY}`,
    borderRadius: '8px',
    color: PRIMARY,
    backgroundColor: 'transparent',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  };

  const heroSection: React.CSSProperties = {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '100px 24px 60px',
    backgroundColor: '#FFFFFF',
  };

  const heroHeading: React.CSSProperties = {
    fontSize: '48px',
    fontWeight: 800,
    color: '#111827',
    lineHeight: 1.15,
    maxWidth: '640px',
    margin: '0 0 20px',
    letterSpacing: '-0.02em',
  };

  const heroSub: React.CSSProperties = {
    fontSize: '20px',
    color: '#6B7280',
    maxWidth: '500px',
    lineHeight: 1.6,
    margin: '0 0 36px',
  };

  const heroButtons: React.CSSProperties = {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: '32px',
  };

  const ctaPrimary: React.CSSProperties = {
    padding: '14px 32px',
    backgroundColor: PRIMARY,
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  };

  const ctaSecondary: React.CSSProperties = {
    padding: '14px 32px',
    backgroundColor: 'transparent',
    color: PRIMARY,
    border: `2px solid ${PRIMARY}`,
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  };

  const trustLine: React.CSSProperties = {
    fontSize: '14px',
    color: '#9CA3AF',
    letterSpacing: '0.02em',
  };

  const featuresSection: React.CSSProperties = {
    padding: '80px 40px',
    backgroundColor: '#F9FAFB',
  };

  const featuresSectionTitle: React.CSSProperties = {
    textAlign: 'center',
    fontSize: '32px',
    fontWeight: 700,
    color: '#111827',
    marginBottom: '48px',
  };

  const featuresGrid: React.CSSProperties = {
    display: 'flex',
    gap: '32px',
    maxWidth: '960px',
    margin: '0 auto',
    justifyContent: 'center',
    flexWrap: 'wrap',
  };

  const featureCard: React.CSSProperties = {
    flex: '1 1 260px',
    maxWidth: '300px',
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '32px 28px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    border: '1px solid #F3F4F6',
    textAlign: 'center',
  };

  const featureEmoji: React.CSSProperties = {
    fontSize: '40px',
    marginBottom: '16px',
  };

  const featureTitle: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: 700,
    color: '#111827',
    marginBottom: '8px',
  };

  const featureDesc: React.CSSProperties = {
    fontSize: '15px',
    color: '#6B7280',
    lineHeight: 1.6,
  };

  const footerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '24px 40px',
    backgroundColor: '#111827',
    color: '#9CA3AF',
    fontSize: '14px',
    flexWrap: 'wrap',
    gap: '12px',
  };

  const footerLink: React.CSSProperties = {
    color: '#D1D5DB',
    textDecoration: 'none',
    cursor: 'pointer',
    fontWeight: 500,
  };

  // ── Handlers ────────────────────────────────────────────────────────────

  const goLogin = () => navigate('/login');

  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div>
      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <nav style={navStyle}>
        <div style={navLogoWrap}>
          <div style={navLogoBox}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18" />
              <path d="M9 21V9" />
            </svg>
          </div>
          <span style={navTitle}>Circle Time</span>
        </div>
        <button
          type="button"
          style={navSignIn}
          onClick={goLogin}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = PRIMARY;
            (e.currentTarget as HTMLButtonElement).style.color = '#FFFFFF';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
            (e.currentTarget as HTMLButtonElement).style.color = PRIMARY;
          }}
        >
          Sign In
        </button>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section style={heroSection}>
        <h1 style={heroHeading}>Smart Meeting Rooms for Modern Teams</h1>
        <p style={heroSub}>
          Book rooms, check in from the door panel,
          and never lose a room to a no-show again.
        </p>
        <div style={heroButtons}>
          <button
            type="button"
            style={ctaPrimary}
            onClick={goLogin}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = PRIMARY_HOVER;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = PRIMARY;
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            style={ctaSecondary}
            onClick={scrollToFeatures}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = PRIMARY;
              (e.currentTarget as HTMLButtonElement).style.color = '#FFFFFF';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
              (e.currentTarget as HTMLButtonElement).style.color = PRIMARY;
            }}
          >
            Learn More
          </button>
        </div>
        <p style={trustLine}>
          Trusted by GROWORX &middot; 8 meeting rooms &middot; 150 team members
        </p>
      </section>

      {/* ── Features ────────────────────────────────────────────────────── */}
      <section id="features" style={featuresSection}>
        <h2 style={featuresSectionTitle}>Everything your team needs</h2>
        <div style={featuresGrid}>
          <div style={featureCard}>
            <div style={featureEmoji}>📅</div>
            <h3 style={featureTitle}>Smart Booking</h3>
            <p style={featureDesc}>
              Find and book available rooms instantly.
              Filter by capacity, amenities, and location.
            </p>
          </div>
          <div style={featureCard}>
            <div style={featureEmoji}>📱</div>
            <h3 style={featureTitle}>Door Panel Display</h3>
            <p style={featureDesc}>
              Each room has a dedicated tablet showing
              real-time availability. Book ad-hoc in seconds.
            </p>
          </div>
          <div style={featureCard}>
            <div style={featureEmoji}>✅</div>
            <h3 style={featureTitle}>Auto Check-in</h3>
            <p style={featureDesc}>
              No more ghost bookings. Rooms are
              automatically released if no one checks in.
            </p>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer style={footerStyle}>
        <span>&copy; 2026 Circle Time &middot; Built for GROWORX</span>
        <a style={footerLink} onClick={goLogin} role="button" tabIndex={0}>
          Sign In
        </a>
      </footer>
    </div>
  );
};

export default LandingPage;

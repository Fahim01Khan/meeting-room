// Design tokens for React Native Panel App — Fishbowl-inspired
// Optimized for SUNMI M2 MAX tablet (~1920×1200 landscape)

export const colors = {
  // ── Core palette ───────────────────────────────────────────────────────────
  primary: "#2563EB",
  primaryHover: "#1D4ED8",
  primaryLight: "#DBEAFE",
  background: "#FFFFFF",
  backgroundSecondary: "#F8FAFC",
  text: "#0F172A",
  textSecondary: "#64748B",
  textMuted: "#94A3B8",
  border: "#E2E8F0",
  success: "#10B981",
  successLight: "#D1FAE5",
  warning: "#F59E0B",
  warningLight: "#FEF3C7",
  error: "#EF4444",
  errorLight: "#FEE2E2",

  // ── Fishbowl full-bleed status colours ─────────────────────────────────────
  statusAvailable: "#16A34A", // green-600  — rich green
  statusAvailableDark: "#15803D", // green-700
  statusOccupied: "#DC2626", // red-600    — vivid red
  statusOccupiedDark: "#B91C1C", // red-700
  statusCheckin: "#D97706", // amber-600  — attention amber
  statusCheckinDark: "#B45309", // amber-700

  // ── Overlay / chrome ───────────────────────────────────────────────────────
  headerBg: "rgba(0,0,0,0.35)", // translucent dark header bar
  footerBg: "rgba(0,0,0,0.20)", // translucent dark footer bar
  overlay: "rgba(0,0,0,0.50)",
  onStatus: "#FFFFFF", // text on coloured backgrounds
  onStatusMuted: "rgba(255,255,255,0.70)",
  onStatusSubtle: "rgba(255,255,255,0.45)",
  timelineBg: "rgba(0,0,0,0.18)", // translucent sidebar
  timelineItem: "rgba(255,255,255,0.15)",
  timelineDivider: "rgba(255,255,255,0.20)",
};

export const spacing = {
  xs: 8,
  sm: 16,
  md: 24,
  lg: 32,
  xl: 48,
  xxl: 64,
};

export const typography = {
  fontFamily: "System",
  fontSize: {
    xs: 14,
    sm: 18,
    base: 22,
    lg: 28,
    xl: 36,
    xxl: 48,
    xxxl: 64,
    display: 96,
  },
  fontWeight: {
    normal: "400" as const,
    medium: "500" as const,
    semibold: "600" as const,
    bold: "700" as const,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const shadows = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
  },
};

// Screen dimensions for SUNMI M2 MAX
export const screenDimensions = {
  width: 1200,
  height: 1920,
};

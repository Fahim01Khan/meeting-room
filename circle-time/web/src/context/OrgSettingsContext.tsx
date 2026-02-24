import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchSettings } from '../services/organisation';
import type { OrgSettings } from '../services/organisation';

// ── Context shape ────────────────────────────────────────────────────────────

interface OrgSettingsContextValue {
  orgName: string;
  primaryColour: string;
  logoUrl: string | null;
  isLoading: boolean;
  /** Call after a successful settings save to refresh context + CSS variable */
  refresh: (updated?: Partial<OrgSettings>) => void;
}

const OrgSettingsContext = createContext<OrgSettingsContextValue>({
  orgName: 'Circle Time',
  primaryColour: '#1E8ACC',
  logoUrl: null,
  isLoading: true,
  refresh: () => {},
});

// ── Colour helpers ───────────────────────────────────────────────────────────

function darkenHex(hex: string, percent: number): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, (n >> 16) - Math.round(2.55 * percent));
  const g = Math.max(0, ((n >> 8) & 0xff) - Math.round(2.55 * percent));
  const b = Math.max(0, (n & 0xff) - Math.round(2.55 * percent));
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
}

function lightenHex(hex: string, percent: number): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, (n >> 16) + Math.round(2.55 * percent));
  const g = Math.min(255, ((n >> 8) & 0xff) + Math.round(2.55 * percent));
  const b = Math.min(255, (n & 0xff) + Math.round(2.55 * percent));
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
}

// ── Provider ─────────────────────────────────────────────────────────────────

export const OrgSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orgName, setOrgName] = useState('Circle Time');
  const [primaryColour, setPrimaryColour] = useState('#1E8ACC');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const applyColour = (colour: string) => {
    document.documentElement.style.setProperty('--primary-colour', colour);
    document.documentElement.style.setProperty('--primary-colour-hover', darkenHex(colour, 15));
    document.documentElement.style.setProperty('--primary-colour-light', lightenHex(colour, 40));
  };

  useEffect(() => {
    fetchSettings()
      .then((settings) => {
        setOrgName(settings.orgName);
        setPrimaryColour(settings.primaryColour);
        setLogoUrl(settings.logoUrl);
        applyColour(settings.primaryColour);
      })
      .catch(() => {
        // Use defaults — user may not be authenticated yet
      })
      .finally(() => setIsLoading(false));
  }, []);

  const refresh = useCallback((updated?: Partial<OrgSettings>) => {
    if (updated) {
      if (updated.orgName !== undefined) setOrgName(updated.orgName);
      if (updated.primaryColour !== undefined) {
        setPrimaryColour(updated.primaryColour);
        applyColour(updated.primaryColour);
      }
      if (updated.logoUrl !== undefined) setLogoUrl(updated.logoUrl);
    } else {
      // Full re-fetch
      fetchSettings()
        .then((settings) => {
          setOrgName(settings.orgName);
          setPrimaryColour(settings.primaryColour);
          setLogoUrl(settings.logoUrl);
          applyColour(settings.primaryColour);
        })
        .catch(() => {});
    }
  }, []);

  return (
    <OrgSettingsContext.Provider value={{ orgName, primaryColour, logoUrl, isLoading, refresh }}>
      {children}
    </OrgSettingsContext.Provider>
  );
};

// ── Hook ─────────────────────────────────────────────────────────────────────

export const useOrgSettings = () => useContext(OrgSettingsContext);

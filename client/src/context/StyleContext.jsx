import { createContext, useContext, useState, useEffect, useMemo } from 'react';

const StyleContext = createContext();

// Core Quizzup theme tokens & presets
export const THEME_TOKENS = {
  dark: {
    accent: '#FFC700',
    accentHover: '#FFD633',
    accentDark: '#D9A800',
    accentGlow: 'rgba(255, 199, 0, 0.22)',
    accentSubtle: 'rgba(255, 199, 0, 0.1)',
    accentContrast: '#0F101A',
    bgPrimary: '#0F101A',
    bgSecondary: '#171826',
    bgCard: 'rgba(23, 24, 38, 0.92)',
    bgCardHover: 'rgba(30, 32, 50, 0.95)',
    bgGlass: 'rgba(255, 255, 255, 0.04)',
    statusOn: '#FFC700',
    statusOff: '#99A0B8',
    textPrimary: '#F3F4F8',
    textSecondary: '#99A0B8',
    textMuted: '#626880',
    borderColor: 'rgba(255, 255, 255, 0.09)',
    borderActive: 'rgba(255, 199, 0, 0.45)',
    success: '#34D399',
    error: '#F87171',
    warning: '#FBBF24',
  },
  light: {
    accent: '#D99B00',
    accentHover: '#B88200',
    accentDark: '#8F6600',
    accentGlow: 'rgba(217, 155, 0, 0.25)',
    accentSubtle: 'rgba(217, 155, 0, 0.12)',
    accentContrast: '#FFFFFF',
    bgPrimary: '#F8F9FD',
    bgSecondary: '#ECEFF6',
    bgCard: '#FFFFFF',
    bgCardHover: '#F3F5FA',
    bgGlass: 'rgba(0, 0, 0, 0.03)',
    statusOn: '#D99B00',
    statusOff: '#64748B',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#94A3B8',
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderActive: 'rgba(217, 155, 0, 0.5)',
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
  }
};

export function StyleProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('quizzup_theme') || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('quizzup_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'light') {
      document.body.classList.add('theme-light');
      document.body.classList.remove('theme-dark');
    } else {
      document.body.classList.add('theme-dark');
      document.body.classList.remove('theme-light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const currentTokens = useMemo(() => THEME_TOKENS[theme] || THEME_TOKENS.dark, [theme]);

  // Utility helpers for consistent component styling
  const getBadgeClass = (active) => {
    return active ? 'badge badge-active' : 'badge badge-inactive';
  };

  const getStatusColor = (active) => {
    return active ? currentTokens.statusOn : currentTokens.statusOff;
  };

  const value = {
    theme,
    setTheme,
    toggleTheme,
    isDark: theme === 'dark',
    tokens: currentTokens,
    getBadgeClass,
    getStatusColor
  };

  return (
    <StyleContext.Provider value={value}>
      {children}
    </StyleContext.Provider>
  );
}

export function useStyle() {
  const context = useContext(StyleContext);
  if (!context) {
    throw new Error('useStyle must be used within a StyleProvider');
  }
  return context;
}

// Convenient alias
export const useTheme = useStyle;

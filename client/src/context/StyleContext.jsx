import { createContext, useContext, useState, useEffect, useMemo } from 'react';

const StyleContext = createContext();

// Core Quizzup theme tokens & presets
export const THEME_TOKENS = {
  dark: {
    accent: '#D4AF37',
    accentHover: '#E2C15A',
    accentDark: '#A88920',
    accentGlow: 'rgba(212, 175, 55, 0.2)',
    accentSubtle: 'rgba(212, 175, 55, 0.08)',
    accentContrast: '#111113',
    bgPrimary: '#101012',
    bgSecondary: '#1A1A1D',
    bgCard: 'rgba(31, 31, 34, 0.94)',
    bgCardHover: 'rgba(42, 42, 46, 0.96)',
    bgGlass: 'rgba(255, 255, 255, 0.04)',
    statusOn: '#D4AF37',
    statusOff: '#A8A8AE',
    textPrimary: '#F8FAFC',
    textSecondary: '#C3C3C8',
    textMuted: '#92929A',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderActive: 'rgba(212, 175, 55, 0.45)',
    success: '#34D399',
    error: '#F87171',
    warning: '#D4AF37',
  },
  light: {
    accent: '#A8831E',
    accentHover: '#8F6E18',
    accentDark: '#705514',
    accentGlow: 'rgba(168, 131, 30, 0.2)',
    accentSubtle: 'rgba(168, 131, 30, 0.1)',
    accentContrast: '#171719',
    bgPrimary: '#F4F4F2',
    bgSecondary: '#E7E7E4',
    bgCard: 'rgba(255, 255, 255, 0.96)',
    bgCardHover: 'rgba(232, 232, 228, 0.98)',
    bgGlass: 'rgba(20, 20, 22, 0.03)',
    statusOn: '#A8831E',
    statusOff: '#77777D',
    textPrimary: '#1A1A1D',
    textSecondary: '#4A4A4E',
    textMuted: '#77777D',
    borderColor: 'rgba(20, 20, 22, 0.12)',
    borderActive: 'rgba(168, 131, 30, 0.5)',
    success: '#10B981',
    error: '#EF4444',
    warning: '#A8831E',
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

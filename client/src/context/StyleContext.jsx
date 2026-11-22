import { createContext, useContext, useState, useEffect, useMemo } from 'react';

const StyleContext = createContext();

// Core Quizzup theme tokens & presets
export const THEME_TOKENS = {
  dark: {
    accent: '#F0ECE2',
    accentHover: '#FBF8F0',
    accentDark: '#D2CABC',
    accentGlow: 'transparent',
    accentSubtle: 'rgba(240, 236, 226, 0.06)',
    accentContrast: '#171512',
    bgPrimary: '#171513',
    bgSecondary: '#211F1C',
    bgCard: '#272420',
    bgCardHover: '#302D29',
    bgGlass: '#272420',
    statusOn: '#FFC700',
    statusOff: '#ACA398',
    textPrimary: '#F7F2E8',
    textSecondary: '#C9C1B5',
    textMuted: '#A49A8E',
    borderColor: 'rgba(248, 242, 229, 0.11)',
    borderActive: 'rgba(240, 236, 226, 0.32)',
    success: '#34D399',
    error: '#F87171',
    warning: '#FFC700',
  },
  light: {
    accent: '#A8831E',
    accentHover: '#8F6E18',
    accentDark: '#705514',
    accentGlow: 'transparent',
    accentSubtle: 'rgba(168, 131, 30, 0.1)',
    accentContrast: '#171719',
    bgPrimary: '#F4F4F2',
    bgSecondary: '#E7E7E4',
    bgCard: '#FFFFFF',
    bgCardHover: '#F5F4F1',
    bgGlass: '#FFFFFF',
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

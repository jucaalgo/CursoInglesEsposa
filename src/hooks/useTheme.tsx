import { useState, useEffect, createContext, useContext, type ReactNode } from 'react';

export type ThemeId = 'midnight' | 'aurora' | 'forest' | 'sunset' | 'ocean' | 'light';

interface ThemeColors {
  name: string;
  bg: {
    primary: string;
    secondary: string;
    tertiary: string;
    card: string;
    cardHover: string;
    input: string;
  };
  accent: {
    primary: string;
    primaryHover: string;
    primaryMuted: string;
    secondary: string;
    secondaryMuted: string;
  };
  success: string;
  successMuted: string;
  error: string;
  errorMuted: string;
  warning: string;
  warningMuted: string;
  text: {
    primary: string;
    secondary: string;
    muted: string;
  };
  border: {
    default: string;
    hover: string;
    focus: string;
  };
  shadow: string;
  shadowAccent: string;
  glass: string;
  glassBorder: string;
}

export const THEMES: Record<ThemeId, ThemeColors> = {
  midnight: {
    name: 'Midnight Indigo',
    bg: {
      primary: '#030712',
      secondary: '#0a0f1e',
      tertiary: '#111827',
      card: 'rgba(17, 24, 39, 0.6)',
      cardHover: 'rgba(17, 24, 39, 0.8)',
      input: '#111827',
    },
    accent: {
      primary: '#6366f1',
      primaryHover: '#818cf8',
      primaryMuted: 'rgba(99, 102, 241, 0.15)',
      secondary: '#a855f7',
      secondaryMuted: 'rgba(168, 85, 247, 0.15)',
    },
    success: '#10b981',
    successMuted: 'rgba(16, 185, 129, 0.15)',
    error: '#ef4444',
    errorMuted: 'rgba(239, 68, 68, 0.15)',
    warning: '#f59e0b',
    warningMuted: 'rgba(245, 158, 11, 0.15)',
    text: {
      primary: '#f9fafb',
      secondary: '#d1d5db',
      muted: '#6b7280',
    },
    border: {
      default: 'rgba(75, 85, 99, 0.4)',
      hover: 'rgba(99, 102, 241, 0.5)',
      focus: '#6366f1',
    },
    shadow: '0 4px 24px rgba(0, 0, 0, 0.4)',
    shadowAccent: '0 4px 24px rgba(99, 102, 241, 0.2)',
    glass: 'rgba(3, 7, 18, 0.8)',
    glassBorder: 'rgba(99, 102, 241, 0.15)',
  },
  aurora: {
    name: 'Aurora Borealis',
    bg: {
      primary: '#0c0a1d',
      secondary: '#130f2e',
      tertiary: '#1a1540',
      card: 'rgba(26, 21, 64, 0.6)',
      cardHover: 'rgba(26, 21, 64, 0.8)',
      input: '#1a1540',
    },
    accent: {
      primary: '#8b5cf6',
      primaryHover: '#a78bfa',
      primaryMuted: 'rgba(139, 92, 246, 0.15)',
      secondary: '#06b6d4',
      secondaryMuted: 'rgba(6, 182, 212, 0.15)',
    },
    success: '#34d399',
    successMuted: 'rgba(52, 211, 153, 0.15)',
    error: '#f87171',
    errorMuted: 'rgba(248, 113, 113, 0.15)',
    warning: '#fbbf24',
    warningMuted: 'rgba(251, 191, 36, 0.15)',
    text: {
      primary: '#f5f3ff',
      secondary: '#c4b5fd',
      muted: '#7c73a8',
    },
    border: {
      default: 'rgba(100, 80, 160, 0.4)',
      hover: 'rgba(139, 92, 246, 0.5)',
      focus: '#8b5cf6',
    },
    shadow: '0 4px 24px rgba(0, 0, 0, 0.5)',
    shadowAccent: '0 4px 24px rgba(139, 92, 246, 0.25)',
    glass: 'rgba(12, 10, 29, 0.85)',
    glassBorder: 'rgba(139, 92, 246, 0.2)',
  },
  forest: {
    name: 'Enchanted Forest',
    bg: {
      primary: '#0a1a0f',
      secondary: '#0d2818',
      tertiary: '#132e1c',
      card: 'rgba(19, 46, 28, 0.6)',
      cardHover: 'rgba(19, 46, 28, 0.8)',
      input: '#132e1c',
    },
    accent: {
      primary: '#22c55e',
      primaryHover: '#4ade80',
      primaryMuted: 'rgba(34, 197, 94, 0.15)',
      secondary: '#14b8a6',
      secondaryMuted: 'rgba(20, 184, 166, 0.15)',
    },
    success: '#22c55e',
    successMuted: 'rgba(34, 197, 94, 0.2)',
    error: '#f87171',
    errorMuted: 'rgba(248, 113, 113, 0.15)',
    warning: '#fbbf24',
    warningMuted: 'rgba(251, 191, 36, 0.15)',
    text: {
      primary: '#ecfdf5',
      secondary: '#a7f3d0',
      muted: '#5b7a65',
    },
    border: {
      default: 'rgba(34, 197, 94, 0.2)',
      hover: 'rgba(34, 197, 94, 0.4)',
      focus: '#22c55e',
    },
    shadow: '0 4px 24px rgba(0, 0, 0, 0.5)',
    shadowAccent: '0 4px 24px rgba(34, 197, 94, 0.2)',
    glass: 'rgba(10, 26, 15, 0.85)',
    glassBorder: 'rgba(34, 197, 94, 0.15)',
  },
  sunset: {
    name: 'Golden Sunset',
    bg: {
      primary: '#1a0a07',
      secondary: '#2d1210',
      tertiary: '#3b1815',
      card: 'rgba(59, 24, 21, 0.6)',
      cardHover: 'rgba(59, 24, 21, 0.8)',
      input: '#3b1815',
    },
    accent: {
      primary: '#f97316',
      primaryHover: '#fb923c',
      primaryMuted: 'rgba(249, 115, 22, 0.15)',
      secondary: '#e11d48',
      secondaryMuted: 'rgba(225, 29, 72, 0.15)',
    },
    success: '#34d399',
    successMuted: 'rgba(52, 211, 153, 0.15)',
    error: '#ef4444',
    errorMuted: 'rgba(239, 68, 68, 0.2)',
    warning: '#f59e0b',
    warningMuted: 'rgba(245, 158, 11, 0.2)',
    text: {
      primary: '#fff7ed',
      secondary: '#fdba74',
      muted: '#9a6450',
    },
    border: {
      default: 'rgba(249, 115, 22, 0.2)',
      hover: 'rgba(249, 115, 22, 0.4)',
      focus: '#f97316',
    },
    shadow: '0 4px 24px rgba(0, 0, 0, 0.5)',
    shadowAccent: '0 4px 24px rgba(249, 115, 22, 0.25)',
    glass: 'rgba(26, 10, 7, 0.85)',
    glassBorder: 'rgba(249, 115, 22, 0.15)',
  },
  ocean: {
    name: 'Deep Ocean',
    bg: {
      primary: '#020617',
      secondary: '#0c1530',
      tertiary: '#0f1d3a',
      card: 'rgba(15, 29, 58, 0.6)',
      cardHover: 'rgba(15, 29, 58, 0.8)',
      input: '#0f1d3a',
    },
    accent: {
      primary: '#0ea5e9',
      primaryHover: '#38bdf8',
      primaryMuted: 'rgba(14, 165, 233, 0.15)',
      secondary: '#6366f1',
      secondaryMuted: 'rgba(99, 102, 241, 0.15)',
    },
    success: '#22d3ee',
    successMuted: 'rgba(34, 211, 238, 0.15)',
    error: '#f87171',
    errorMuted: 'rgba(248, 113, 113, 0.15)',
    warning: '#fbbf24',
    warningMuted: 'rgba(251, 191, 36, 0.15)',
    text: {
      primary: '#f0f9ff',
      secondary: '#7dd3fc',
      muted: '#4a6580',
    },
    border: {
      default: 'rgba(14, 165, 233, 0.2)',
      hover: 'rgba(14, 165, 233, 0.4)',
      focus: '#0ea5e9',
    },
    shadow: '0 4px 24px rgba(0, 0, 0, 0.5)',
    shadowAccent: '0 4px 24px rgba(14, 165, 233, 0.2)',
    glass: 'rgba(2, 6, 23, 0.85)',
    glassBorder: 'rgba(14, 165, 233, 0.15)',
  },
  light: {
    name: 'Clean Light',
    bg: {
      primary: '#ffffff',
      secondary: '#f8fafc',
      tertiary: '#f1f5f9',
      card: 'rgba(241, 245, 249, 0.8)',
      cardHover: 'rgba(241, 245, 249, 1)',
      input: '#f1f5f9',
    },
    accent: {
      primary: '#6366f1',
      primaryHover: '#4f46e5',
      primaryMuted: 'rgba(99, 102, 241, 0.1)',
      secondary: '#a855f7',
      secondaryMuted: 'rgba(168, 85, 247, 0.1)',
    },
    success: '#10b981',
    successMuted: 'rgba(16, 185, 129, 0.1)',
    error: '#ef4444',
    errorMuted: 'rgba(239, 68, 68, 0.1)',
    warning: '#f59e0b',
    warningMuted: 'rgba(245, 158, 11, 0.1)',
    text: {
      primary: '#0f172a',
      secondary: '#475569',
      muted: '#94a3b8',
    },
    border: {
      default: 'rgba(148, 163, 184, 0.3)',
      hover: 'rgba(99, 102, 241, 0.5)',
      focus: '#6366f1',
    },
    shadow: '0 4px 24px rgba(0, 0, 0, 0.08)',
    shadowAccent: '0 4px 24px rgba(99, 102, 241, 0.15)',
    glass: 'rgba(255, 255, 255, 0.8)',
    glassBorder: 'rgba(99, 102, 241, 0.1)',
  },
};

const THEME_STORAGE_KEY = 'profesoria_theme';

interface ThemeContextType {
  theme: ThemeId;
  themeColors: ThemeColors;
  setTheme: (theme: ThemeId) => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  theme: 'midnight',
  themeColors: THEMES.midnight,
  setTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeId>(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return (stored && stored in THEMES) ? stored as ThemeId : 'midnight';
  });

  const setTheme = (newTheme: ThemeId) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
  };

  useEffect(() => {
    const colors = THEMES[theme];
    const root = document.documentElement;
    root.style.setProperty('--bg-primary', colors.bg.primary);
    root.style.setProperty('--bg-secondary', colors.bg.secondary);
    root.style.setProperty('--bg-tertiary', colors.bg.tertiary);
    root.style.setProperty('--bg-card', colors.bg.card);
    root.style.setProperty('--bg-card-hover', colors.bg.cardHover);
    root.style.setProperty('--bg-input', colors.bg.input);
    root.style.setProperty('--accent-primary', colors.accent.primary);
    root.style.setProperty('--accent-primary-hover', colors.accent.primaryHover);
    root.style.setProperty('--accent-primary-muted', colors.accent.primaryMuted);
    root.style.setProperty('--accent-secondary', colors.accent.secondary);
    root.style.setProperty('--accent-secondary-muted', colors.accent.secondaryMuted);
    root.style.setProperty('--success', colors.success);
    root.style.setProperty('--success-muted', colors.successMuted);
    root.style.setProperty('--error', colors.error);
    root.style.setProperty('--error-muted', colors.errorMuted);
    root.style.setProperty('--warning', colors.warning);
    root.style.setProperty('--warning-muted', colors.warningMuted);
    root.style.setProperty('--text-primary', colors.text.primary);
    root.style.setProperty('--text-secondary', colors.text.secondary);
    root.style.setProperty('--text-muted', colors.text.muted);
    root.style.setProperty('--border-default', colors.border.default);
    root.style.setProperty('--border-hover', colors.border.hover);
    root.style.setProperty('--border-focus', colors.border.focus);
    root.style.setProperty('--shadow', colors.shadow);
    root.style.setProperty('--shadow-accent', colors.shadowAccent);
    root.style.setProperty('--glass', colors.glass);
    root.style.setProperty('--glass-border', colors.glassBorder);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, themeColors: THEMES[theme], setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
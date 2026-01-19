export type ThemeColors = {
  background: string;
  card: string;
  accent: string;
  accentLight: string;
  gradientStart: string;
  gradientEnd: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  success: string;
};

const darkColors: ThemeColors = {
  background: '#121212',
  card: '#1A1A1A',
  accent: '#FF3366',
  accentLight: '#FF6B9D',
  gradientStart: '#FF3366',
  gradientEnd: '#FF6B9D',
  text: '#F4F3EE',
  textSecondary: '#A0A0A0',
  border: '#2A2A2A',
  error: '#FF6B6B',
  success: '#51CF66',
};

const lightColors: ThemeColors = {
  background: '#FFFFFF',
  card: '#F8F8F8',
  accent: '#FF3366',
  accentLight: '#FF6B9D',
  gradientStart: '#FF3366',
  gradientEnd: '#FF6B9D',
  text: '#1A1A1A',
  textSecondary: '#6B6B6B',
  border: '#E5E5E5',
  error: '#FF6B6B',
  success: '#51CF66',
};

export const GeckoTheme = {
  colors: darkColors,
  dark: {
    colors: darkColors,
  },
  light: {
    colors: lightColors,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
  },
  typography: {
    h1: {
      fontSize: 32,
      fontWeight: '600' as const,
    },
    h2: {
      fontSize: 24,
      fontWeight: '600' as const,
    },
    h3: {
      fontSize: 20,
      fontWeight: '600' as const,
    },
    body: {
      fontSize: 16,
      fontWeight: '400' as const,
    },
    caption: {
      fontSize: 14,
      fontWeight: '400' as const,
    },
  },
};

export const getThemeColors = (isDark: boolean): ThemeColors => {
  return isDark ? darkColors : lightColors;
};

import { useMemo } from 'react';
import { useTheme } from './theme-context';
import { getThemeColors, GeckoTheme } from '@/constants/theme';

export function useThemedStyles() {
  const { isDark } = useTheme();
  const colors = useMemo(() => getThemeColors(isDark), [isDark]);
  
  return {
    colors,
    spacing: GeckoTheme.spacing,
    borderRadius: GeckoTheme.borderRadius,
    typography: GeckoTheme.typography,
  };
}

export type ThemedStyle = ReturnType<typeof useThemedStyles>;

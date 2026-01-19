import { TouchableOpacity, StyleSheet } from 'react-native';
import { Sun, Moon } from 'lucide-react-native';
import { useTheme } from '@/lib/theme-context';
import { getThemeColors } from '@/constants/theme';

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();
  const colors = getThemeColors(isDark);

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.card }]}
      onPress={toggleTheme}
      activeOpacity={0.7}
    >
      {isDark ? (
        <Sun size={20} color={colors.accent} />
      ) : (
        <Moon size={20} color={colors.accent} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

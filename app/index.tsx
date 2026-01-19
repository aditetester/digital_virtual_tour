import { Redirect } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { GeckoTheme } from '@/constants/theme';

export default function Index() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.logo}>GECKO DIGITAL</Text>
        <ActivityIndicator size="large" color={GeckoTheme.colors.accent} style={styles.loader} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return <Redirect href="/(tabs)/home" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GeckoTheme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: GeckoTheme.colors.accent,
    letterSpacing: 2,
    marginBottom: 40,
  },
  loader: {
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: GeckoTheme.colors.textSecondary,
  },
});

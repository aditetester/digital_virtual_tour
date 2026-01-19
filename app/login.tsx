import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { GeckoTheme } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }

    setIsLoading(true);
    setError('');

    const result = await login(email, password);

    if (result.success) {
      router.replace('/(tabs)/home');
    } else {
      setError(result.error || 'Login failed');
    }

    setIsLoading(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.logo}>GECKO DIGITAL</Text>
            <Text style={styles.tagline}>Virtual Tour Excellence</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Log in to access your virtual tours</Text>

            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor={GeckoTheme.colors.textSecondary}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor={GeckoTheme.colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!isLoading}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color={GeckoTheme.colors.background} />
              ) : (
                <Text style={styles.buttonText}>Log In</Text>
              )}
            </TouchableOpacity>

            <View style={styles.demoNote}>
              <Text style={styles.demoText}>Demo Mode: Enter any email and password</Text>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GeckoTheme.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: GeckoTheme.spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logo: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: GeckoTheme.colors.accent,
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 14,
    color: GeckoTheme.colors.textSecondary,
    marginTop: 8,
  },
  form: {
    width: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: GeckoTheme.colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: GeckoTheme.colors.textSecondary,
    marginBottom: 32,
  },
  errorContainer: {
    backgroundColor: '#ff4444' + '20',
    padding: GeckoTheme.spacing.md,
    borderRadius: GeckoTheme.borderRadius.md,
    marginBottom: GeckoTheme.spacing.md,
    borderWidth: 1,
    borderColor: '#ff4444',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    fontWeight: '500' as const,
  },
  inputContainer: {
    marginBottom: GeckoTheme.spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: GeckoTheme.colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: GeckoTheme.colors.card,
    borderWidth: 1,
    borderColor: GeckoTheme.colors.border,
    borderRadius: GeckoTheme.borderRadius.md,
    padding: GeckoTheme.spacing.md,
    fontSize: 16,
    color: GeckoTheme.colors.text,
  },
  button: {
    backgroundColor: GeckoTheme.colors.accent,
    borderRadius: GeckoTheme.borderRadius.md,
    padding: GeckoTheme.spacing.md,
    alignItems: 'center',
    marginTop: GeckoTheme.spacing.md,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: GeckoTheme.colors.background,
    textAlign: 'center' as const,
  },
  demoNote: {
    marginTop: GeckoTheme.spacing.xl,
    padding: GeckoTheme.spacing.md,
    backgroundColor: GeckoTheme.colors.card,
    borderRadius: GeckoTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: GeckoTheme.colors.border,
  },
  demoText: {
    fontSize: 12,
    color: GeckoTheme.colors.textSecondary,
    textAlign: 'center',
  },
});

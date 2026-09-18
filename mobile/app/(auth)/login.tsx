import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Platform, Text } from 'react-native';
import { api } from '../../src/lib/api';
import { useAuth } from '../../src/lib/auth';
import { Button } from '../../src/ui/Button';
import { Input } from '../../src/ui/Input';
import { Screen } from '../../src/ui/Screen';
import { type } from '../../src/ui/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [appleError, setAppleError] = useState<string | null>(null);

  async function onLogin() {
    setLoading(true);
    setError(null);
    try {
      const session = await api.login({ email, password });
      await signIn(session.accessToken, session.user);
      router.replace('/(tabs)');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  async function onApple() {
    setAppleError(null);
    if (Platform.OS !== 'ios') {
      setAppleError('Sign in with Apple is available on iOS devices.');
      return;
    }
    try {
      const AppleAuthentication = await import('expo-apple-authentication');
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!credential.identityToken) {
        setAppleError('Apple did not return an identity token');
        return;
      }
      const session = await api.apple(
        credential.identityToken,
        credential.email ?? undefined,
      );
      await signIn(session.accessToken, session.user);
      router.replace('/(tabs)');
    } catch (err) {
      setAppleError(err instanceof Error ? err.message : 'Apple sign-in failed');
    }
  }

  return (
    <Screen>
      <Text style={type.title}>Stash</Text>
      <Text style={type.muted}>Sign in to continue</Text>
      <Input
        label="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <Input
        label="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {error ? <Text style={type.muted}>{error}</Text> : null}
      <Button label="Sign in" loading={loading} onPress={() => void onLogin()} />
      <Button label="Sign in with Apple" variant="secondary" onPress={() => void onApple()} />
      {appleError ? <Text style={type.muted}>{appleError}</Text> : null}
      <Link href="/(auth)/register">
        <Text style={type.body}>Create an account</Text>
      </Link>
      <Link href="/(auth)/forgot-password">
        <Text style={type.muted}>Forgot password</Text>
      </Link>
    </Screen>
  );
}

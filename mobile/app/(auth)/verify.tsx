import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';
import { api } from '../../src/lib/api';
import { useAuth } from '../../src/lib/auth';
import { Button } from '../../src/ui/Button';
import { Input } from '../../src/ui/Input';
import { Screen } from '../../src/ui/Screen';
import { type } from '../../src/ui/theme';

export default function VerifyScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const params = useLocalSearchParams<{ email?: string; token?: string }>();
  const [token, setToken] = useState(params.token ?? '');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onVerify() {
    setLoading(true);
    setError(null);
    try {
      const session = await api.verifyEmail(token.trim());
      await signIn(session.accessToken, session.user);
      router.replace('/(tabs)');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  }

  async function onResend() {
    if (!params.email) {
      return;
    }
    await api.resendVerification(params.email);
  }

  return (
    <Screen>
      <Text style={type.title}>Verify email</Text>
      <Text style={type.muted}>
        Enter the token from your verification email. Locally it is printed in the API console.
      </Text>
      <Input label="Token" value={token} onChangeText={setToken} autoCapitalize="none" />
      {error ? <Text style={type.muted}>{error}</Text> : null}
      <Button label="Verify" loading={loading} onPress={() => void onVerify()} />
      {params.email ? (
        <Button label="Resend email" variant="ghost" onPress={() => void onResend()} />
      ) : null}
    </Screen>
  );
}

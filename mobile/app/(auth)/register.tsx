import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';
import { api } from '../../src/lib/api';
import { Button } from '../../src/ui/Button';
import { Input } from '../../src/ui/Input';
import { Screen } from '../../src/ui/Screen';
import { type } from '../../src/ui/theme';

export default function RegisterScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onRegister() {
    setLoading(true);
    setError(null);
    try {
      const result = await api.register({ email, password, primaryCurrency: 'RSD' });
      setMessage(result.message);
      router.push({ pathname: '/(auth)/verify', params: { email } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Text style={type.title}>Create account</Text>
      <Input label="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
      <Input label="Password" secureTextEntry value={password} onChangeText={setPassword} />
      {error ? <Text style={type.muted}>{error}</Text> : null}
      {message ? <Text style={type.muted}>{message}</Text> : null}
      <Button label="Register" loading={loading} onPress={() => void onRegister()} />
      <Link href="/(auth)/login">
        <Text style={type.muted}>Already have an account</Text>
      </Link>
    </Screen>
  );
}

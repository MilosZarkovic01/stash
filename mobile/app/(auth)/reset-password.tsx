import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';
import { api } from '../../src/lib/api';
import { useAuth } from '../../src/lib/auth';
import { Button } from '../../src/ui/Button';
import { Input } from '../../src/ui/Input';
import { Screen } from '../../src/ui/Screen';
import { type } from '../../src/ui/theme';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const params = useLocalSearchParams<{ token?: string }>();
  const [token, setToken] = useState(params.token ?? '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  return (
    <Screen>
      <Text style={type.title}>New password</Text>
      <Input label="Token" value={token} onChangeText={setToken} autoCapitalize="none" />
      <Input label="Password" secureTextEntry value={password} onChangeText={setPassword} />
      {error ? <Text style={type.muted}>{error}</Text> : null}
      <Button
        label="Reset password"
        onPress={() => {
          void api
            .resetPassword(token.trim(), password)
            .then(async (session) => {
              await signIn(session.accessToken, session.user);
              router.replace('/(tabs)');
            })
            .catch((err: unknown) =>
              setError(err instanceof Error ? err.message : 'Reset failed'),
            );
        }}
      />
    </Screen>
  );
}

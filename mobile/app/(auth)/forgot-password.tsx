import { useState } from 'react';
import { Text } from 'react-native';
import { api } from '../../src/lib/api';
import { Button } from '../../src/ui/Button';
import { Input } from '../../src/ui/Input';
import { Screen } from '../../src/ui/Screen';
import { type } from '../../src/ui/theme';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  return (
    <Screen>
      <Text style={type.title}>Reset password</Text>
      <Input label="Email" autoCapitalize="none" value={email} onChangeText={setEmail} />
      {message ? <Text style={type.muted}>{message}</Text> : null}
      <Button
        label="Send reset email"
        onPress={() => {
          void api.forgotPassword(email).then((res) => setMessage(res.message));
        }}
      />
    </Screen>
  );
}

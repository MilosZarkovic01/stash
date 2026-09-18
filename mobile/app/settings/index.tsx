import { Text } from 'react-native';
import { useAuth } from '../../src/lib/auth';
import { api } from '../../src/lib/api';
import { Button } from '../../src/ui/Button';
import { Screen } from '../../src/ui/Screen';
import { type } from '../../src/ui/theme';
import { useRouter } from 'expo-router';
import { useRequireAuth } from '../../src/lib/use-require-auth';

export default function SettingsScreen() {
  useRequireAuth();
  const { user, signOut, refresh } = useAuth();
  const router = useRouter();

  return (
    <Screen>
      <Text style={type.title}>Profile</Text>
      <Text style={type.body}>{user?.email}</Text>
      <Text style={type.muted}>Primary currency {user?.primaryCurrency}</Text>
      <Button
        label="Use RSD as primary"
        variant="secondary"
        onPress={() => {
          void api.updateMe('RSD').then(() => refresh());
        }}
      />
      <Button
        label="Use EUR as primary"
        variant="secondary"
        onPress={() => {
          void api.updateMe('EUR').then(() => refresh());
        }}
      />
      <Button
        label="Sign out"
        onPress={() => {
          void signOut().then(() => router.replace('/(auth)/login'));
        }}
      />
    </Screen>
  );
}

import { Redirect, Stack } from 'expo-router';
import { useAuth } from '../../src/lib/auth';

export default function AuthLayout() {
  const { token, user } = useAuth();
  if (token && user?.emailVerified) {
    return <Redirect href="/(tabs)" />;
  }
  return <Stack screenOptions={{ headerShadowVisible: false }} />;
}

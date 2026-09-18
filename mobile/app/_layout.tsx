import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider, useAuth } from '../src/lib/auth';
import { queryClient } from '../src/lib/query-client';
import { colors } from '../src/ui/theme';

function RootNav() {
  const { loading } = useAuth();
  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.fg} />
      </View>
    );
  }
  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShadowVisible: false, headerTitleStyle: { color: colors.fg } }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="accounts/index" options={{ title: 'Accounts' }} />
        <Stack.Screen name="accounts/[id]" options={{ title: 'Account' }} />
        <Stack.Screen name="recurring/index" options={{ title: 'Recurring' }} />
        <Stack.Screen name="settings/index" options={{ title: 'Settings' }} />
        <Stack.Screen name="transaction/new" options={{ title: 'Add' }} />
        <Stack.Screen name="transaction/[id]" options={{ title: 'Transaction' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RootNav />
      </AuthProvider>
    </QueryClientProvider>
  );
}

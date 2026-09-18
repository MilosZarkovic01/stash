import { Redirect, Tabs } from 'expo-router';
import { useAuth } from '../../src/lib/auth';
import { colors } from '../../src/ui/theme';

export default function TabsLayout() {
  const { token, user } = useAuth();
  if (!token) {
    return <Redirect href="/(auth)/login" />;
  }
  if (user && !user.emailVerified) {
    return <Redirect href="/(auth)/verify" />;
  }
  return (
    <Tabs
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.bg },
        headerTitleStyle: { color: colors.fg, fontWeight: '600' },
        tabBarActiveTintColor: colors.fg,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopColor: colors.line,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="activity" options={{ title: 'Activity' }} />
      <Tabs.Screen name="insights" options={{ title: 'Insights' }} />
      <Tabs.Screen name="goals" options={{ title: 'Goals' }} />
    </Tabs>
  );
}

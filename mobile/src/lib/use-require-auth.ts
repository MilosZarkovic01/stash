import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from './auth';

export function useRequireAuth() {
  const { token, user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (loading) {
      return;
    }
    if (!token) {
      router.replace('/(auth)/login');
      return;
    }
    if (user && !user.emailVerified) {
      router.replace('/(auth)/verify');
    }
  }, [loading, token, user, router]);
}

import { Platform } from 'react-native';

const KEY = 'stash.accessToken';

export async function getToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return globalThis.localStorage?.getItem(KEY) ?? null;
  }
  const SecureStore = await import('expo-secure-store');
  return SecureStore.getItemAsync(KEY);
}

export async function setToken(token: string | null): Promise<void> {
  if (Platform.OS === 'web') {
    if (!token) {
      globalThis.localStorage?.removeItem(KEY);
      return;
    }
    globalThis.localStorage?.setItem(KEY, token);
    return;
  }
  const SecureStore = await import('expo-secure-store');
  if (!token) {
    await SecureStore.deleteItemAsync(KEY);
    return;
  }
  await SecureStore.setItemAsync(KEY, token);
}

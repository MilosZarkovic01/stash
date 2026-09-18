import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { getHealth } from '../../src/lib/api';

export default function HomeScreen() {
  const health = useQuery({ queryKey: ['health'], queryFn: getHealth });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Stash</Text>
      <Text style={styles.subtitle}>Current position</Text>
      {health.isLoading ? (
        <ActivityIndicator color="#111111" />
      ) : (
        <Text style={styles.status}>
          API: {health.data?.status ?? 'unavailable'}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 24,
    gap: 8,
  },
  title: {
    color: '#111111',
    fontSize: 28,
    fontWeight: '600',
  },
  subtitle: {
    color: '#8A8A8A',
    fontSize: 16,
  },
  status: {
    marginTop: 16,
    color: '#111111',
    fontSize: 16,
  },
});

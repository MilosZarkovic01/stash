import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors } from './theme';

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.box}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}

export function LoadingState() {
  return (
    <View style={styles.box}>
      <ActivityIndicator color={colors.fg} />
    </View>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <View style={styles.box}>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.body}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { paddingVertical: 32, gap: 8 },
  title: { fontSize: 18, fontWeight: '600', color: colors.fg },
  body: { fontSize: 15, color: colors.muted },
});

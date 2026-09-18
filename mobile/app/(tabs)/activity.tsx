import { StyleSheet, Text, View } from 'react-native';

export default function ActivityScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Activity</Text>
      <Text style={styles.body}>Recent transactions will appear here.</Text>
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
  body: {
    color: '#8A8A8A',
    fontSize: 16,
  },
});

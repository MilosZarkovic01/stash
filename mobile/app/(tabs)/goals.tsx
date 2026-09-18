import { StyleSheet, Text, View } from 'react-native';

export default function GoalsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Goals</Text>
      <Text style={styles.body}>Savings goals will appear here.</Text>
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

import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, space } from './theme';

export function Sheet({
  visible,
  title,
  children,
  onClose,
}: {
  visible: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
      <View style={styles.sheet}>
        <Text style={styles.title}>{title}</Text>
        {children}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)' },
  sheet: {
    backgroundColor: colors.bg,
    padding: space.lg,
    gap: space.md,
    borderTopLeftRadius: radius * 1.2,
    borderTopRightRadius: radius * 1.2,
    borderWidth: 1,
    borderColor: colors.line,
  },
  title: { fontSize: 20, fontWeight: '600', color: colors.fg },
});

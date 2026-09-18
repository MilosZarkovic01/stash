import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from './theme';

type Props = {
  title: string;
  subtitle?: string;
  meta?: string;
  onPress?: () => void;
};

export function ListRow({ title, subtitle, meta, onPress }: Props) {
  const content = (
    <View style={styles.row}>
      <View style={styles.text}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {meta ? <Text style={styles.meta}>{meta}</Text> : null}
    </View>
  );
  if (!onPress) {
    return content;
  }
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
    gap: 12,
  },
  text: { flex: 1, gap: 2 },
  title: { fontSize: 16, color: colors.fg },
  subtitle: { fontSize: 13, color: colors.muted },
  meta: { fontSize: 16, color: colors.fg, fontWeight: '600' },
  pressed: { opacity: 0.6 },
});

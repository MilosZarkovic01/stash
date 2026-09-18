import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { colors, radius } from './theme';

type Props = TextInputProps & { label: string };

export function Input({ label, style, ...rest }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.muted}
        style={[styles.input, style]}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontSize: 13, color: colors.muted },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius,
    paddingHorizontal: 12,
    fontSize: 16,
    color: colors.fg,
    backgroundColor: colors.bg,
  },
});

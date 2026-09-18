import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
} from 'react-native';
import { colors, radius } from './theme';

type Props = PressableProps & {
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  loading?: boolean;
};

export function Button({
  label,
  variant = 'primary',
  loading,
  disabled,
  ...rest
}: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'ghost' && styles.ghost,
        (pressed || disabled || loading) && styles.pressed,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#FFFFFF' : colors.fg} />
      ) : (
        <Text
          style={[
            styles.label,
            variant === 'primary' && styles.primaryLabel,
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: radius,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primary: { backgroundColor: colors.fg },
  secondary: { backgroundColor: colors.fill, borderWidth: 1, borderColor: colors.line },
  ghost: { backgroundColor: 'transparent' },
  pressed: { opacity: 0.7 },
  label: { fontSize: 16, fontWeight: '600', color: colors.fg },
  primaryLabel: { color: '#FFFFFF' },
});

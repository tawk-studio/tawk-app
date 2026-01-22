import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, type PressableProps } from 'react-native';
import { useTheme } from '@/src/theme/useTheme';
import type { Theme } from '@/src/theme';

type Props = PressableProps & {
  title: string;
};

export function PrimaryButton({ title, style, ...rest }: Props) {
  const t = useTheme();
  const styles = useMemo(() => createStyles(t), [t]);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
        style as any,
      ]}
      {...rest}
    >
      <Text style={styles.text}>{title}</Text>
    </Pressable>
  );
}

function createStyles(t: Theme) {
  return StyleSheet.create({
    button: {
      paddingVertical: t.spacing.s,
      paddingHorizontal: t.spacing.m,
      borderRadius: t.radius.m,
      borderWidth: 1,
      borderColor: t.colors.border,
      backgroundColor: t.colors.surface,
      alignSelf: 'flex-start',
    },
    pressed: {
      opacity: 0.85,
    },
    text: {
      fontSize: 16,
      fontWeight: '600',
      color: t.colors.primary,
    },
  });
}

import { useMemo } from 'react';
import { StyleSheet, Text, type TextProps } from 'react-native';
import { useTheme } from '@/src/theme/useTheme';
import type { Theme } from '@/src/theme';

type Variant = 'title' | 'subtitle' | 'body' | 'caption';

type Props = TextProps & {
  variant?: Variant;
};

export function ThemedText({ variant = 'body', style, ...rest }: Props) {
  const t = useTheme();
  const styles = useMemo(() => createStyles(t), [t]);

  return <Text style={[styles.base, styles[variant], style]} {...rest} />;
}

function createStyles(t: Theme) {
  return StyleSheet.create({
    base: {
      color: t.colors.text,
    },
    title: {
      ...t.text.title,
    },
    subtitle: {
      ...t.text.subtitle,
    },
    body: {
      ...t.text.body,
    },
    caption: {
      ...t.text.caption,
      color: t.colors.mutedText,
    },
  });
}

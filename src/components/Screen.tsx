import { useMemo } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import { useTheme } from '@/src/theme/useTheme';
import type { Theme } from '@/src/theme';

type Props = ViewProps & {
  padded?: boolean;
};

export function Screen({ padded = true, style, ...rest }: Props) {
  const t = useTheme();
  const styles = useMemo(() => createStyles(t, padded), [t, padded]);

  return <View style={[styles.container, style]} {...rest} />;
}

function createStyles(t: Theme, padded: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: t.colors.background,
      padding: padded ? t.spacing.m : 0,
    },
  });
}

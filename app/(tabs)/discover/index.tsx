import { StyleSheet, Text, useColorScheme, View } from 'react-native';
import { getTheme, Theme } from '@/src/theme';
import { useMemo } from 'react';

export default function DiscoverScreen() {
  const colorScheme = useColorScheme();
  const t = getTheme(colorScheme);
  const styles = useMemo(() => createStyles(t), [t]);
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Discover</Text>
    </View>
  );
}

function createStyles(t: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      padding: t.spacing.m,
      justifyContent: 'center',
      gap: t.spacing.s,
      backgroundColor: t.colors.background,
    },
    title: {
      ...t.text.title,
      color: t.colors.text,
    },
  });
}

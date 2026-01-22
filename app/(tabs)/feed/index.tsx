import { StyleSheet, Text, View, useColorScheme } from 'react-native';
import { useMemo } from 'react';
import { getTheme, Theme } from '@/src/theme';

export default function FeedScreen() {
  const colorScheme = useColorScheme();
  const t = getTheme(colorScheme);
  const styles = useMemo(() => createStyles(t), [t]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Feed</Text>
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

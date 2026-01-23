import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { useMemo } from 'react';
import { getTheme } from '@/src/theme';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';

export default function StudioStackLayout() {
  const t = getTheme(useColorScheme());

  const screenOptions = useMemo<NativeStackNavigationOptions>(
    () => ({
      headerStyle: {
        backgroundColor: t.colors.background,
      },
      headerTintColor: t.colors.text,
      headerTitleStyle: {
        fontWeight: '700' as const,
      },
      headerShadowVisible: false,
    }),
    [t],
  );

  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="index" options={{ title: 'Studio' }} />
    </Stack>
  );
}

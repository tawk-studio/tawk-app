import { Stack } from 'expo-router';
import { AuthProvider } from '@/src/auth/auth-context';
import { getTheme } from '@/src/theme';
import { useColorScheme } from 'react-native';

export default function RootLayout() {
  const t = getTheme(useColorScheme());

  return (
    <AuthProvider>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: t.colors.background },
          headerTintColor: t.colors.text,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ title: 'Sign in' }} />
      </Stack>
    </AuthProvider>
  );
}

import { SplashScreen, Stack } from 'expo-router';
import { AuthProvider } from '@/src/auth/auth-context';
import { getTheme } from '@/src/theme';
import { useColorScheme, View } from 'react-native';
import { useFonts } from 'expo-font';
import { useCallback, useEffect, useState } from 'react';
import { AudioPlayerProvider } from '@/src/contexts/AudioPlayerContext';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    // Inter: require('../assets/fonts/Inter-Regular.ttf'),
    // add more fonts here
  });
  const t = getTheme(useColorScheme());

  useEffect(() => {
    if (error) console.warn(error);
  }, [error]);

  const [bootReady, setBootReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        // await restoreSession();
        // await hydrateStore();
      } finally {
        setBootReady(true);
      }
    })();
  }, []);

  const appReady = loaded && bootReady;

  const onLayoutRootView = useCallback(async () => {
    if (appReady) await SplashScreen.hideAsync();
  }, [appReady]);

  if (!appReady) return null;

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <AuthProvider>
        <AudioPlayerProvider>
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: t.colors.background },
              headerTintColor: t.colors.text,
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ title: 'Sign in' }} />
          </Stack>
        </AudioPlayerProvider>
      </AuthProvider>
    </View>
  );
}

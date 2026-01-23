import { Slot, Stack, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme, View } from 'react-native';
import { useMemo } from 'react';
import { getTheme } from '@/src/theme';
import { BottomNav } from '@/src/components/BottomNav';

export default function TabsLayout() {
  const t = getTheme(useColorScheme());

  const screenOptions = useMemo(
    () => ({
      headerStyle: {
        backgroundColor: t.colors.background,
      },
      headerTintColor: t.colors.text,

      tabBarStyle: {
        backgroundColor: t.colors.background,
        borderTopColor: t.colors.border,
      },
      tabBarActiveTintColor: t.colors.primary,
      tabBarInactiveTintColor: t.colors.mutedText,
    }),
    [t],
  );

  return (
    // <Tabs
    //   screenOptions={({ route }) => ({
    //     ...screenOptions,
    //     tabBarIcon: ({ size, color, focused }) => {
    //       const name =
    //         route.name === 'feed'
    //           ? focused
    //             ? 'mic'
    //             : 'mic-outline'
    //           : route.name === 'discover'
    //             ? focused
    //               ? 'search'
    //               : 'search-outline'
    //             : focused
    //               ? 'settings'
    //               : 'settings-outline';
    //
    //       return <Ionicons name={name} size={size} color={color} />;
    //     },
    //   })}
    // >
    //   <Tabs.Screen
    //     name="feed"
    //     options={{ title: 'Feed', headerShown: false }}
    //   />
    //   <Tabs.Screen
    //     name="discover"
    //     options={{ title: 'Discover', headerShown: false }}
    //   />
    //   <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    // </Tabs>
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
      <BottomNav />
    </View>
  );
}

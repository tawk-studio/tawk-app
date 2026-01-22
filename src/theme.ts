import { Platform } from 'react-native';

export type Theme = typeof lightTheme;

type ColorScheme = 'light' | 'dark' | null | undefined;

export const lightTheme = {
  colors: {
    // Core surfaces
    background: '#F8FAFC', // light background
    surface: '#FFFFFF', // cards / popovers
    text: '#0B0F19', // tawk navy
    mutedText: '#64748B', // subdued text

    // Brand / actions
    primary: '#1FBFA0', // tawk mint (slightly darker for contrast)
    accent: '#2DD4BF', // accent mint
    danger: '#DC2626', // destructive

    // UI chrome
    border: '#E2E8F0',
    input: '#F1F5F9',
    ring: '#1FBFA0',

    // App-specific
    sidebarBackground: '#0B0F19',
    sidebarSurface: '#111827',
  },

  spacing: {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
  },

  radius: {
    s: 6,
    m: 10,
    l: 16,
  },

  text: {
    title: {
      fontSize: 28,
      fontWeight: '700' as const,
    },
    subtitle: {
      fontSize: 18,
      fontWeight: '600' as const,
    },
    body: {
      fontSize: 16,
      lineHeight: 22,
    },
    caption: {
      fontSize: 13,
      color: '#6B7280',
    },
  },

  shadow: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
    },
    android: {
      elevation: 4,
    },
    default: {},
  }),
};

export const darkTheme: Theme = {
  ...lightTheme,
  colors: {
    // Core surfaces
    background: '#0B0F19', // --background (222 47% 8%)
    surface: '#121A2A', // --card / --popover (222 40% 12%)
    text: '#E6FAF3', // --foreground (160 60% 95%)
    mutedText: '#7B8794', // --muted-foreground (220 15% 55%)

    // Brand / actions
    primary: '#5FE3C0', // --primary / --tawk-mint (162 70% 65%)
    accent: '#4FC9AE', // --accent (162 50% 50%)
    danger: '#E04B4B', // --destructive (0 62% 55%)

    // UI chrome
    border: '#24314D', // --border (222 30% 22%)
    input: '#1E293B', // --input (222 30% 18%)
    ring: '#5FE3C0', // --ring (162 70% 65%)

    // App-specific
    sidebarBackground: '#0B0F19', // --sidebar-background
    sidebarSurface: '#1B2436', // --sidebar-accent
  },
  // Adjust iOS shadow to be slightly stronger in dark mode
  shadow: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOpacity: 0.35,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 6 },
    },
    android: {
      elevation: 6,
    },
    default: {},
  }),
};

export function getTheme(colorScheme: ColorScheme): Theme {
  return colorScheme === 'dark' ? darkTheme : lightTheme;
}

import { Platform } from 'react-native';

export type Theme = typeof lightTheme;

type ColorScheme = 'light' | 'dark' | null | undefined;

export const lightTheme = {
  colors: {
    background: '#FFFFFF',
    surface: '#F7F7F7',
    text: '#111111',
    mutedText: '#6B7280',
    border: '#E5E7EB',
    primary: '#2563EB',
    danger: '#DC2626',
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
    background: '#0B0F19',
    surface: '#121A2A',
    text: '#F3F4F6',
    mutedText: '#9CA3AF',
    border: '#24314D',
    primary: '#60A5FA',
    danger: '#F87171',
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

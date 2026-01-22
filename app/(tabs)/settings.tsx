import { useRouter } from 'expo-router';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { useAuth } from '@/src/auth/auth-context';
import { useMemo } from 'react';
import { getTheme, Theme } from '@/src/theme';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const t = getTheme(colorScheme);
  const styles = useMemo(() => createStyles(t), [t]);

  const router = useRouter();
  const { signOut } = useAuth();

  const onSignOut = async () => {
    await signOut();
    router.replace('/login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <Pressable style={styles.button} onPress={onSignOut}>
        <Text style={styles.buttonText}>Sign out</Text>
      </Pressable>
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
    button: {
      paddingVertical: t.spacing.s,
      paddingHorizontal: t.spacing.m,
      borderRadius: t.radius.m,
      borderWidth: 1,
      borderColor: t.colors.border,
      backgroundColor: t.colors.surface,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '600',
      color: t.colors.primary,
    },
  });
}

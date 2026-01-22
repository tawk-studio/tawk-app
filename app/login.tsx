import { useRouter } from 'expo-router';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { useMemo } from 'react';
import { useAuth } from '@/src/auth/auth-context';
import { getTheme, Theme } from '@/src/theme';

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const t = getTheme(colorScheme);
  const styles = useMemo(() => createStyles(t), [t]);

  const router = useRouter();
  const { signIn } = useAuth();

  const onSignIn = async () => {
    // Replace with real auth later (API / OAuth)
    await signIn('demo-token');
    router.replace('/(tabs)/feed');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign in</Text>

      <Pressable style={styles.button} onPress={onSignIn}>
        <Text style={styles.buttonText}>Sign in (demo)</Text>
      </Pressable>

      <Text style={styles.hint}>
        Later we’ll swap this for real auth (Supabase/Firebase/etc).
      </Text>
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
    hint: {
      marginTop: t.spacing.s,
      fontSize: 13,
      lineHeight: 18,
      color: t.colors.mutedText,
    },
  });
}

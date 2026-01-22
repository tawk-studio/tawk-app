import { useRouter } from 'expo-router';
import { useAuth } from '@/src/auth/auth-context';
import { Screen } from '@/src/components/Screen';
import { ThemedText } from '@/src/components/ThemedText';
import { PrimaryButton } from '@/src/components/PrimaryButton';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();

  const onSignIn = async () => {
    // Replace with real auth later (API / OAuth)
    await signIn('demo-token');
    router.replace('/(tabs)/feed');
  };

  return (
    <Screen style={{ justifyContent: 'center', gap: 12 }}>
      <ThemedText variant="title">Sign in</ThemedText>

      <PrimaryButton title="Sign in (demo)" onPress={onSignIn} />
      <ThemedText variant="caption">
        Later we’ll swap this for real auth (Supabase/Firebase/etc).
      </ThemedText>
    </Screen>
  );
}

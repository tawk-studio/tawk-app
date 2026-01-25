import { useRouter } from 'expo-router';
import { useAuth } from '@/src/auth/auth-context';
import { Screen } from '@/src/components/Screen';
import { ThemedText } from '@/src/components/ThemedText';
import { PrimaryButton } from '@/src/components/button';

export default function SettingsScreen() {
  const router = useRouter();
  const { signOut } = useAuth();

  const onSignOut = async () => {
    await signOut();
    router.replace('/login');
  };

  return (
    <Screen style={{ justifyContent: 'center', gap: 12 }}>
      <ThemedText variant="title">Settings</ThemedText>

      <PrimaryButton title="Sign out" onPress={onSignOut} />
    </Screen>
  );
}

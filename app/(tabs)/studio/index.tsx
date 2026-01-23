import { Screen } from '@/src/components/Screen';
import { ThemedText } from '@/src/components/ThemedText';

export default function StudioScreen() {
  return (
    <Screen style={{ justifyContent: 'center', gap: 12 }}>
      <ThemedText variant="title">Studio</ThemedText>
    </Screen>
  );
}

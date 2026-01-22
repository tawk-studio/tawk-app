import { ThemedText } from '@/src/components/ThemedText';
import { Screen } from '@/src/components/Screen';

export default function FeedScreen() {
  return (
    <Screen style={{ justifyContent: 'center', gap: 12 }}>
      <ThemedText variant="title">Feed</ThemedText>
    </Screen>
  );
}

import { ThemedText } from '@/src/components/ThemedText';
import { Screen } from '@/src/components/Screen';
import { feedData } from '@/src/utils/dummy-data/feedDummyData';
import TawkCard from '@/src/features/tawk/components/TawkCard';

export default function FeedScreen() {
  return (
    <Screen style={{ justifyContent: 'center', gap: 12 }}>
      <ThemedText variant="title">Feed</ThemedText>
      {feedData.map((tawk) => (
        <TawkCard
          tawk={tawk}
          key={tawk.id}
          onPlay={(t) => console.log('play', t.id)}
          isHeard={false}
        />
      ))}
    </Screen>
  );
}

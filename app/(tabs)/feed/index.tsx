import { ThemedText } from '@/src/components/ThemedText';
import { Screen } from '@/src/components/Screen';
import { feedData } from '@/src/utils/dummy-data/feedDummyData';
import TawkCard from '@/src/features/tawk/components/TawkCard';
import { useGlobalAudioPlayer } from '@/src/contexts/AudioPlayerContext';

export default function FeedScreen() {
  const player = useGlobalAudioPlayer();

  return (
    <Screen style={{ justifyContent: 'center' }}>
      {/*<ThemedText variant="title">Feed</ThemedText>*/}
      {feedData.map((tawk) => (
        <TawkCard
          tawk={tawk}
          key={tawk.id}
          onPlay={(t) => {
            player.playTawk(t);
            console.log('play', t.id);
          }}
          isHeard={false}
          currentlyPlayingId={player.currentTawk?.id}
          isPlaying={player.isPlaying}
        />
      ))}
    </Screen>
  );
}

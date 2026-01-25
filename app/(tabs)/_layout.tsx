import { Stack } from 'expo-router';
import { View, useColorScheme } from 'react-native';
import { getTheme } from '@/src/theme';
import { BottomNav } from '@/src/components/BottomNav';
import MiniPlayer from '@/src/features/tawk/components/MiniPlayer';
import { useGlobalAudioPlayer } from '@/src/contexts/AudioPlayerContext';

export default function TabsLayout() {
  const t = getTheme(useColorScheme());
  const p = useGlobalAudioPlayer();

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>
      <Stack screenOptions={{ headerShown: false }} />
      <MiniPlayer
        tawk={p.currentTawk}
        isPlaying={Boolean(p.isPlaying)}
        progress={Number(p.progress ?? 0)}
        currentTime={Number(p.currentTime ?? 0)}
        queue={p.playQueue}
        currentQueueIndex={Number(p.currentQueueIndex ?? 0)}
        onPlayPause={p.togglePlayPause}
        onSkip={p.skip}
        onClose={p.close}
        onSeek={p.seek}
        onPlayQueueItem={p.playQueueItem}
        onRemoveQueueItem={p.removeFromQueue}
      />
      <BottomNav />
    </View>
  );
}

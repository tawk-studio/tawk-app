import { useMemo } from 'react';
import { StyleSheet, ScrollView, type ScrollViewProps } from 'react-native';
import { useTheme } from '@/src/theme/useTheme';
import type { Theme } from '@/src/theme';
import { BOTTOM_NAV_MARGIN } from '@/src/components/BottomNav';
import { useGlobalAudioPlayer } from '@/src/contexts/AudioPlayerContext';
import { BOTTOM_PLAYER_MARGIN } from '@/src/features/tawk/components/MiniPlayer';

type Props = ScrollViewProps & {
  padded?: boolean;
};

export function Screen({ padded = true, style, ...rest }: Props) {
  const player = useGlobalAudioPlayer();
  const t = useTheme();
  const styles = useMemo(
    () => createStyles(t, padded, !!player.currentTawk),
    [t, padded],
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, style]}
      keyboardShouldPersistTaps="handled"
      {...rest}
    />
  );
}

function createStyles(t: Theme, padded: boolean, isPlayerActive: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: t.colors.background,
    },
    content: {
      flexGrow: 1,
      paddingHorizontal: padded ? t.spacing.m : 0,
      paddingBottom: padded
        ? isPlayerActive
          ? BOTTOM_NAV_MARGIN + BOTTOM_PLAYER_MARGIN
          : BOTTOM_NAV_MARGIN
        : 0,
    },
  });
}

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronUp,
  Pause,
  Play,
  SkipForward,
  User,
  X,
} from 'lucide-react-native';
import { useTheme } from '@/src/theme/useTheme';
import type { Theme } from '@/src/theme';
import { Button } from '@/src/components/button';
import { BOTTOM_NAV_MARGIN } from '@/src/components/BottomNav';
import { hexToRgba } from '@/src/utils/hex-to-rgba';
import PlaybackQueueSheet from '@/src/features/tawk/components/PlaybackQueueSheet';
import { Tawk } from '@/src/features/tawk/types/tawk';
import { formatDuration } from '@/src/utils/format-duration';

export const BOTTOM_PLAYER_MARGIN = 150;

export interface MiniPlayerProps {
  tawk: Tawk | null;
  isPlaying: boolean;
  progress: number; // 0..100
  currentTime: number; // seconds
  queue: Tawk[];
  currentQueueIndex: number;
  onPlayPause: () => void;
  onSkip: () => void;
  onClose: () => void;
  onSeek: (percent: number) => void;
  onPlayQueueItem: (index: number) => void;
  onRemoveQueueItem: (index: number) => void;
}

export const MiniPlayer = ({
  tawk,
  isPlaying,
  progress,
  currentTime,
  queue,
  currentQueueIndex,
  onPlayPause,
  onSkip,
  onClose,
  onSeek,
  onPlayQueueItem,
  onRemoveQueueItem,
}: MiniPlayerProps) => {
  const t = useTheme();
  const styles = useMemo(() => createStyles(t), [t]);
  const insets = useSafeAreaInsets();
  const [queueOpen, setQueueOpen] = useState(false);

  // Keep a rendered copy so we can animate out when `tawk` becomes null.
  const [renderedTawk, setRenderedTawk] = useState<Tawk | null>(tawk);
  const [renderedQueue, setRenderedQueue] = useState<Tawk[]>(queue);
  const [renderedQueueIndex, setRenderedQueueIndex] =
    useState<number>(currentQueueIndex);

  const translateY = useRef(new Animated.Value(tawk ? 0 : 140)).current;
  const opacity = useRef(new Animated.Value(tawk ? 1 : 0)).current;

  useEffect(() => {
    if (tawk) {
      // Update rendered data when we have an active tawk.
      setRenderedTawk(tawk);
      setRenderedQueue(queue);
      setRenderedQueueIndex(currentQueueIndex);

      // Animate in.
      translateY.stopAnimation();
      opacity.stopAnimation();
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    // Animate out (slide down), then unrender.
    translateY.stopAnimation();
    opacity.stopAnimation();
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 140,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 160,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setRenderedTawk(null);
        setQueueOpen(false);
      }
    });
  }, [tawk, queue, currentQueueIndex, opacity, translateY]);

  const displayedTawk = tawk ?? renderedTawk;
  const displayedQueue = tawk ? queue : renderedQueue;
  const displayedQueueIndex = tawk ? currentQueueIndex : renderedQueueIndex;

  if (!displayedTawk) return null;

  const isReply = displayedQueueIndex > 0 && displayedQueue.length > 1;

  return (
    <>
      <Animated.View
        pointerEvents="box-none"
        style={[
          styles.wrap,
          {
            bottom: insets.bottom + BOTTOM_NAV_MARGIN - 26,
            transform: [{ translateY }],
            opacity,
          },
        ]}
      >
        <View style={styles.card}>
          {/* Clickable area to open queue */}
          <Pressable style={styles.topTap} onPress={() => setQueueOpen(true)}>
            <View style={styles.topRow}>
              <View style={styles.topLeft}>
                <Text style={styles.mutedText}>
                  {formatDuration(currentTime)}
                </Text>
                {displayedQueue.length > 1 ? (
                  <Text style={styles.primaryText}>
                    {displayedQueueIndex + 1}/{displayedQueue.length}
                  </Text>
                ) : null}
              </View>

              <View style={styles.topRight}>
                <Text style={styles.mutedText}>
                  {formatDuration(displayedTawk.duration)}
                </Text>
                <ChevronUp size={16} color={t.colors.mutedText} />
              </View>
            </View>

            {/* Scrubber */}
            <Pressable
              style={styles.sliderWrap}
              onPress={(e) => e.stopPropagation?.()}
            >
              <Slider
                value={Math.max(0, Math.min(100, progress))}
                minimumValue={0}
                maximumValue={100}
                step={0.1}
                onValueChange={(value) => onSeek(value)}
                minimumTrackTintColor={t.colors.primary}
                maximumTrackTintColor={hexToRgba(t.colors.text, 0.2)}
                thumbTintColor={t.colors.primary}
              />
            </Pressable>
          </Pressable>

          <View style={styles.bottomRow}>
            <View style={styles.avatar}>
              {displayedTawk.author.avatarUrl ? (
                <Image
                  source={{ uri: displayedTawk.author.avatarUrl }}
                  style={styles.avatarImg}
                />
              ) : (
                <User size={18} color={t.colors.mutedText} />
              )}
            </View>

            <Pressable
              style={styles.titleBtn}
              onPress={() => setQueueOpen(true)}
            >
              <View style={styles.titleRow}>
                <Text
                  numberOfLines={1}
                  style={[styles.title, isReply && styles.titleReply]}
                >
                  {displayedTawk.title}
                </Text>
                {isReply ? (
                  <View style={styles.replyPill}>
                    <Text style={styles.replyPillText}>Reply</Text>
                  </View>
                ) : null}
              </View>
              <Text numberOfLines={1} style={styles.author}>
                {displayedTawk.author.displayName}
              </Text>
            </Pressable>

            <View style={styles.controls}>
              <Button
                variant="ghost"
                size="icon"
                onPress={onPlayPause}
                left={
                  isPlaying ? (
                    <Pause size={20} color={t.colors.text} />
                  ) : (
                    <Play size={20} color={t.colors.text} />
                  )
                }
              />

              <Button
                variant="ghost"
                size="icon"
                onPress={onSkip}
                left={<SkipForward size={20} color={t.colors.text} />}
              />

              <Button
                variant="ghost"
                size="icon"
                onPress={onClose}
                left={<X size={18} color={t.colors.mutedText} />}
              />
            </View>
          </View>
        </View>
      </Animated.View>

      <PlaybackQueueSheet
        open={queueOpen}
        onClose={() => setQueueOpen(false)}
        queue={displayedQueue.map((item, idx) => ({
          ...item,
          isReply: idx > 0,
        }))}
        currentIndex={displayedQueueIndex}
        onPlayItem={onPlayQueueItem}
        onRemoveItem={onRemoveQueueItem}
      />
    </>
  );
};

export default MiniPlayer;

function createStyles(t: Theme) {
  return StyleSheet.create({
    wrap: {
      position: 'absolute',
      left: 0,
      right: 0,
      zIndex: 40,
    },
    card: {
      marginHorizontal: 8,
      marginBottom: 8,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: t.colors.border,
      backgroundColor: hexToRgba(t.colors.surface, 0.92),
      overflow: 'hidden',
      ...t.shadow,
    },

    topTap: {
      paddingHorizontal: 12,
      paddingTop: 12,
      paddingBottom: 6,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    topLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    mutedText: {
      fontSize: 12,
      color: t.colors.mutedText,
      fontWeight: '600',
    },
    primaryText: {
      fontSize: 12,
      color: t.colors.primary,
      fontWeight: '700',
    },
    topRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },

    sliderWrap: {
      paddingHorizontal: 2,
    },

    bottomRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 12,
      paddingTop: 8,
      paddingBottom: 12,
    },

    avatar: {
      width: 40,
      height: 40,
      borderRadius: 999,
      backgroundColor: t.colors.input,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    avatarImg: {
      width: '100%',
      height: '100%',
    },

    titleBtn: {
      flex: 1,
      minWidth: 0,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    title: {
      flex: 1,
      fontSize: 14,
      fontWeight: '800',
      color: t.colors.text,
    },
    titleReply: {
      color: t.colors.primary,
    },
    replyPill: {
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: 999,
      backgroundColor: hexToRgba(t.colors.primary, 0.16),
    },
    replyPillText: {
      fontSize: 10,
      fontWeight: '800',
      color: t.colors.primary,
    },
    author: {
      marginTop: 2,
      fontSize: 12,
      fontWeight: '600',
      color: t.colors.mutedText,
    },

    controls: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },

    // Sheet
    sheetBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: t.colors.surface,
      borderTopLeftRadius: 18,
      borderTopRightRadius: 18,
      borderWidth: 1,
      borderColor: t.colors.border,
      overflow: 'hidden',
      maxHeight: '75%',
    },
    sheetHeader: {
      paddingHorizontal: 14,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottomWidth: 1,
      borderBottomColor: t.colors.border,
    },
    sheetTitle: {
      fontSize: 16,
      fontWeight: '900',
      color: t.colors.text,
    },
    sheetItem: {
      paddingHorizontal: 14,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      borderBottomWidth: 1,
      borderBottomColor: t.colors.border,
    },
    sheetItemActive: {
      backgroundColor: hexToRgba(t.colors.primary, 0.08),
    },
    sheetAvatar: {
      width: 34,
      height: 34,
      borderRadius: 999,
      backgroundColor: t.colors.input,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    sheetAvatarImg: {
      width: '100%',
      height: '100%',
    },
    sheetTextCol: {
      flex: 1,
      minWidth: 0,
    },
    sheetItemTitle: {
      fontSize: 13,
      fontWeight: '800',
      color: t.colors.text,
    },
    sheetItemMeta: {
      marginTop: 2,
      fontSize: 12,
      fontWeight: '600',
      color: t.colors.mutedText,
    },
    sheetRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    sheetTime: {
      fontSize: 12,
      fontWeight: '700',
      color: t.colors.mutedText,
    },
  });
}

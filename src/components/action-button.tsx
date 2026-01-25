import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from '@/src/theme/useTheme';
import {
  Alert,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useGlobalAudioPlayer } from '@/src/contexts/AudioPlayerContext';
import { Comment } from '@/src/features/tawk/types/comment';
import {
  ChevronDown,
  ChevronUp,
  Heart,
  MessageCircle,
  Mic,
  Repeat2,
} from 'lucide-react-native';
import { Theme } from '@/src/theme';

type ActionButtonBaseProps = {
  onPress: () => void;
  children: React.ReactNode;
};

function ActionButtonBase({ onPress, children }: ActionButtonBaseProps) {
  const t = useTheme();
  const styles = useMemo(() => createStyles(t), [t]);

  return (
    <Pressable style={styles.actionBtn} onPress={onPress}>
      {children}
    </Pressable>
  );
}

export function LikeButton({
  isLiked,
  likesCount,
  onPress,
}: {
  isLiked: boolean;
  likesCount: number;
  onPress: () => void;
}) {
  const t = useTheme();
  const styles = useMemo(() => createStyles(t), [t]);

  const likeScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // reset if parent rerenders a new item
    likeScale.setValue(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const run = () => {
    likeScale.stopAnimation();
    likeScale.setValue(1);

    Animated.sequence([
      Animated.timing(likeScale, {
        toValue: isLiked ? 1.08 : 1.22,
        duration: 110,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(likeScale, {
        toValue: 0.96,
        duration: 120,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(likeScale, {
        toValue: 1,
        duration: 120,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <Pressable
      style={styles.actionBtn}
      onPress={() => {
        run();
        onPress();
      }}
    >
      <Animated.View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          transform: [{ scale: likeScale }],
        }}
      >
        <Heart
          size={16}
          color={isLiked ? t.colors.danger : t.colors.mutedText}
          fill={isLiked ? t.colors.danger : undefined}
        />
        <Text style={styles.actionText}>{likesCount}</Text>
      </Animated.View>
    </Pressable>
  );
}

export function RepliesButton({
  repliesCount,
  onPress,
}: {
  repliesCount: number;
  onPress: () => void;
}) {
  const t = useTheme();
  const styles = useMemo(() => createStyles(t), [t]);

  return (
    <ActionButtonBase onPress={onPress}>
      <Mic size={16} color={t.colors.mutedText} />
      <Text style={styles.actionText}>{repliesCount} Replies</Text>
    </ActionButtonBase>
  );
}

export function CommentsButton({
  commentsCount,
  open,
  onPress,
}: {
  commentsCount: number;
  open: boolean;
  onPress: () => void;
}) {
  const t = useTheme();
  const styles = useMemo(() => createStyles(t), [t]);

  return (
    <ActionButtonBase onPress={onPress}>
      <MessageCircle size={16} color={t.colors.mutedText} />
      <Text style={styles.actionText}>{commentsCount} Comments</Text>
      {open ? (
        <ChevronUp size={14} color={t.colors.mutedText} />
      ) : (
        <ChevronDown size={14} color={t.colors.mutedText} />
      )}
    </ActionButtonBase>
  );
}

export function EchoButton({ onPress }: { onPress: () => void }) {
  const t = useTheme();
  const styles = useMemo(() => createStyles(t), [t]);

  return (
    <Pressable style={[styles.actionBtn, styles.echoBtn]} onPress={onPress}>
      <Repeat2 size={16} color={t.colors.mutedText} />
    </Pressable>
  );
}

function createStyles(t: Theme) {
  return StyleSheet.create({
    actionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 6,
      paddingHorizontal: 8,
      borderRadius: t.radius.m,
    },
    actionText: { fontSize: 12, color: t.colors.text, fontWeight: '600' },
    echoBtn: { marginLeft: 'auto' },
  });
}

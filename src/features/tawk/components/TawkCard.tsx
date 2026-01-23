import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
  useColorScheme,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Tawk } from '@/src/features/tawk/types/tawk';
import { useGlobalAudioPlayer } from '@/src/contexts/AudioPlayerContext';

// If you already use an icon library in RN, replace these with your preferred icons.
import {
  Check,
  ChevronDown,
  ChevronUp,
  Heart,
  MessageCircle,
  Mic,
  Pause,
  Play,
  Repeat2,
  User,
} from 'lucide-react-native';
import { getTheme, Theme } from '@/src/theme';
import { useTheme } from '@/src/theme/useTheme';

interface FeedContext {
  type: 'echo' | 'room';
  echoedByUser?: { id: string; displayName: string };
  originalAuthor?: { id: string; displayName: string };
  roomId?: string;
  roomName?: string;
}

type Comment = {
  id: string;
  content: string;
  createdAt?: string;
  author: {
    id: string;
    displayName: string;
    avatarUrl?: string | null;
  };
};

interface TawkCardProps {
  tawk: Tawk;
  onPlay?: (tawk: Tawk) => void;
  isPlaying?: boolean;
  showReplies?: boolean;
  onPlayReplies?: boolean;
  isHeard?: boolean;
  onPlayReply?: (reply: any) => void;
  currentlyPlayingId?: string | null;
  heardTawks?: Set<string>;
  context?: FeedContext;
  initialOpenReplies?: boolean;
  initialOpenComments?: boolean;
  scrollToReplyId?: string;
  onTitleUpdated?: (tawkId: string, newTitle: string) => void;
  onDeleted?: (tawkId: string) => void;

  // RN-friendly additions
  style?: StyleProp<ViewStyle>;
  onPress?: () => void; // optional override for card press

  // Optional handlers to integrate with your data layer (Supabase/TanStack/etc.)
  onLikeToggle?: (tawk: Tawk, nextLiked: boolean) => Promise<number | void>; // return updated count if you want
  onFetchComments?: (tawk: Tawk) => Promise<Comment[]>;
  onSubmitComment?: (tawk: Tawk, content: string) => Promise<void>;
  onEchoToggle?: (
    tawk: Tawk,
    destination: { type: 'feed' | 'room'; id?: string },
    nextEchoed: boolean,
  ) => Promise<void>;
}

const Waveform = ({ active }: { active: boolean }) => {
  const t = useTheme();
  const styles = useMemo(() => createStyles(t), [t]);
  // styles is passed as prop in TawkCard's body, so we need to get it from React context.
  // We'll use a React context trick: expect styles to be available in closure.
  const bars = useMemo(() => Array.from({ length: 40 }, (_, i) => i), []);
  // styles is available from closure (see below, Waveform used inside TawkCard)
  // @ts-ignore
  return (
    <View style={styles.waveWrap}>
      {bars.map((i) => {
        // deterministic-ish heights (avoid Math.random in render)
        const h = 10 + Math.abs(Math.sin(i * 0.55)) * 18;
        return (
          <View
            key={i}
            style={[
              styles.waveBar,
              { height: h },
              active ? styles.waveBarActive : styles.waveBarIdle,
            ]}
          />
        );
      })}
    </View>
  );
};

const TawkCard = ({
  context,
  currentlyPlayingId,
  heardTawks = new Set(),
  initialOpenComments = false,
  initialOpenReplies = false,
  isHeard,
  isPlaying,
  onDeleted,
  onPlay,
  onPlayReply,
  onPress,
  style,
  tawk,
  onLikeToggle,
  onFetchComments,
  onSubmitComment,
  onEchoToggle,
}: TawkCardProps) => {
  const t = useTheme();
  const styles = useMemo(() => createStyles(t), [t]);
  const router = useRouter();
  const { currentTawk, close: closePlayer } = useGlobalAudioPlayer();

  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(tawk.likesCount ?? 0);
  const [repliesCount, setRepliesCount] = useState(tawk.repliesCount ?? 0);
  const [commentsCount, setCommentsCount] = useState(tawk.commentsCount ?? 0);

  const [showComments, setShowComments] = useState(initialOpenComments);
  const [isRepliesOpen, setIsRepliesOpen] = useState(initialOpenReplies);
  const [isEchoOpen, setIsEchoOpen] = useState(false);

  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const displayedTitle = tawk.title ?? 'Untitled';

  const navigate = (path: string) => router.push(path as any);

  const displayedAuthor =
    context?.type === 'echo' && context.echoedByUser
      ? {
          id: context.echoedByUser.id,
          displayName: context.echoedByUser.displayName,
        }
      : { id: tawk.author.id, displayName: tawk.author.displayName };

  const handleCardPress = () => {
    if (onPress) return onPress();
    navigate(`/tawk/${tawk.id}`);
  };

  const handleAuthorPress = () => {
    // Adjust these routes to your RN app
    navigate(`/user/${displayedAuthor.id}`);
  };

  const handleDelete = async () => {
    // You can wire deletion via props/callbacks
    if (currentTawk?.id === tawk.id) {
      closePlayer();
    }

    Alert.alert('Delete tawk', 'This cannot be undone', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          onDeleted?.(tawk.id);
        },
      },
    ]);
  };

  const handleLike = async () => {
    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    setLikesCount((prev) => prev + (nextLiked ? 1 : -1));

    try {
      const maybeCount = await onLikeToggle?.(tawk, nextLiked);
      if (typeof maybeCount === 'number') {
        setLikesCount(maybeCount);
      }
    } catch {
      // rollback
      setIsLiked(!nextLiked);
      setLikesCount((prev) => prev + (nextLiked ? -1 : 1));
    }
  };

  const loadComments = async () => {
    if (!onFetchComments) return;
    try {
      const data = await onFetchComments(tawk);
      setComments(data);
      setCommentsCount(data.length);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (showComments) {
      loadComments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showComments]);

  const submitComment = async () => {
    const content = newComment.trim();
    if (!content || !onSubmitComment) return;

    setIsSubmitting(true);
    try {
      await onSubmitComment(tawk, content);
      setNewComment('');
      await loadComments();
    } finally {
      setIsSubmitting(false);
    }
  };

  const active = Boolean(isPlaying || currentlyPlayingId === tawk.id);

  const renderInlineContext = () => {
    if (!context) return null;

    if (context.type === 'echo' && context.originalAuthor) {
      return (
        <Text style={styles.inlineContext}>
          {' '}
          echoed{' '}
          <Text
            style={styles.inlineLink}
            onPress={() => navigate(`/user/${context.originalAuthor!.id}`)}
          >
            {context.originalAuthor.displayName}
          </Text>
          {context.roomId && context.roomName ? (
            <>
              {' '}
              via{' '}
              <Text
                style={styles.inlineLink}
                onPress={() => navigate(`/room/${context.roomId}`)}
              >
                {context.roomName}
              </Text>
            </>
          ) : null}
        </Text>
      );
    }

    if (context.type === 'room' && context.roomId && context.roomName) {
      return (
        <Text style={styles.inlineContext}>
          {' '}
          via{' '}
          <Text
            style={styles.inlineLink}
            onPress={() => navigate(`/room/${context.roomId}`)}
          >
            {context.roomName}
          </Text>
        </Text>
      );
    }

    return null;
  };

  return (
    <>
      <Pressable style={[styles.card, style]} onPress={handleCardPress}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Pressable onPress={handleAuthorPress} style={styles.avatarBtn}>
            {tawk.author.avatarUrl ? (
              <Image
                source={{ uri: tawk.author.avatarUrl }}
                style={styles.avatarImg}
              />
            ) : (
              <User size={18} color={t.colors.mutedText} />
            )}
          </Pressable>

          <View style={styles.headerTextCol}>
            <Text numberOfLines={1} style={styles.authorLine}>
              <Text style={styles.authorName} onPress={handleAuthorPress}>
                {displayedAuthor.displayName}
              </Text>
              {renderInlineContext()}
            </Text>
            <Text style={styles.metaLine} numberOfLines={1}>
              @{tawk.author.username} · {tawk.createdAt ?? ''}
            </Text>
          </View>

          <View style={styles.headerRight}>
            {isHeard ? (
              <View style={styles.heardPill}>
                <Check size={12} color={t.colors.mutedText} />
              </View>
            ) : null}
            <View style={styles.durationPill}>
              <Text style={styles.durationText}>{tawk.duration ?? ''}</Text>
            </View>
          </View>
        </View>

        {/* Title + description */}
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={2}>
            {displayedTitle}
          </Text>
          <Pressable onPress={handleDelete} hitSlop={10}>
            <Text style={styles.moreText}>⋯</Text>
          </Pressable>
        </View>

        {tawk.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {tawk.description}
          </Text>
        ) : null}

        {/* Player */}
        <View style={styles.playerRow}>
          <Pressable
            style={[
              styles.playBtn,
              active ? styles.playBtnActive : styles.playBtnIdle,
            ]}
            onPress={(e) => {
              e.stopPropagation?.();
              onPlay?.(tawk);
            }}
          >
            {active ? (
              <Pause size={18} color={t.colors.surface} />
            ) : (
              <Play size={18} color={t.colors.text} />
            )}
          </Pressable>

          <Waveform active={active} />
        </View>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <Pressable style={styles.actionBtn} onPress={handleLike}>
            <Heart
              size={16}
              color={isLiked ? t.colors.danger : t.colors.mutedText}
            />
            <Text style={styles.actionText}>{likesCount}</Text>
          </Pressable>

          <Pressable
            style={styles.actionBtn}
            onPress={() => setIsRepliesOpen(true)}
          >
            <Mic size={16} color={t.colors.mutedText} />
            <Text style={styles.actionText}>{repliesCount} Replies</Text>
          </Pressable>

          <Pressable
            style={styles.actionBtn}
            onPress={() => setShowComments((v) => !v)}
          >
            <MessageCircle size={16} color={t.colors.mutedText} />
            <Text style={styles.actionText}>{commentsCount} Comments</Text>
            {showComments ? (
              <ChevronUp size={14} color={t.colors.mutedText} />
            ) : (
              <ChevronDown size={14} color={t.colors.mutedText} />
            )}
          </Pressable>

          <Pressable
            style={[styles.actionBtn, styles.echoBtn]}
            onPress={() => setIsEchoOpen(true)}
          >
            <Repeat2 size={16} color={t.colors.mutedText} />
          </Pressable>
        </View>

        {/* Comments */}
        {showComments ? (
          <View style={styles.commentsWrap}>
            {comments.length ? (
              <View style={{ gap: t.spacing.s }}>
                {comments.map((c) => (
                  <Pressable
                    key={c.id}
                    style={styles.commentRow}
                    onPress={() => navigate(`/user/${c.author.id}`)}
                  >
                    <View style={styles.commentAvatar}>
                      {c.author.avatarUrl ? (
                        <Image
                          source={{ uri: c.author.avatarUrl }}
                          style={styles.commentAvatarImg}
                        />
                      ) : (
                        <User size={14} color={t.colors.mutedText} />
                      )}
                    </View>
                    <View style={styles.commentBody}>
                      <Text style={styles.commentAuthor} numberOfLines={1}>
                        {c.author.displayName}
                      </Text>
                      <Text style={styles.commentText}>{c.content}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>No comments yet.</Text>
            )}

            {/* Comment input */}
            {onSubmitComment ? (
              <View style={styles.commentInputRow}>
                <TextInput
                  value={newComment}
                  onChangeText={setNewComment}
                  placeholder="Add a comment…"
                  placeholderTextColor={t.colors.mutedText}
                  style={styles.commentInput}
                />
                <Pressable
                  style={[
                    styles.sendBtn,
                    (isSubmitting || !newComment.trim()) &&
                      styles.sendBtnDisabled,
                  ]}
                  disabled={isSubmitting || !newComment.trim()}
                  onPress={submitComment}
                >
                  <Text style={styles.sendBtnText}>Send</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        ) : null}
      </Pressable>

      {/* Replies Modal (placeholder) */}
      <Modal
        visible={isRepliesOpen}
        animationType="slide"
        onRequestClose={() => setIsRepliesOpen(false)}
      >
        <View style={styles.modalScreen}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Replies</Text>
            <Pressable onPress={() => setIsRepliesOpen(false)}>
              <Text style={styles.modalClose}>Close</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalHint}>
              Swap this modal with your existing RepliesListDialog
              implementation.
            </Text>
            <Pressable
              style={styles.modalPrimaryBtn}
              onPress={() => {
                setIsRepliesOpen(false);
                // Example: navigate to replies screen
                navigate(`/tawk/${tawk.id}/replies`);
              }}
            >
              <Text style={styles.modalPrimaryBtnText}>
                Open replies screen
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </Modal>

      {/* Echo Modal (placeholder) */}
      <Modal
        visible={isEchoOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsEchoOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setIsEchoOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => undefined}>
            <Text style={styles.sheetTitle}>Echo</Text>

            <Pressable
              style={styles.sheetItem}
              onPress={async () => {
                setIsEchoOpen(false);
                await onEchoToggle?.(tawk, { type: 'feed' }, true);
              }}
            >
              <Text style={styles.sheetItemText}>Echo to My Feed</Text>
            </Pressable>

            <Pressable
              style={styles.sheetItem}
              onPress={async () => {
                setIsEchoOpen(false);
                // You can swap this with a room picker flow
                await onEchoToggle?.(
                  tawk,
                  { type: 'room', id: 'ROOM_ID' },
                  true,
                );
              }}
            >
              <Text style={styles.sheetItemText}>Echo to a Room…</Text>
            </Pressable>

            <Pressable
              style={[styles.sheetItem, styles.sheetCancel]}
              onPress={() => setIsEchoOpen(false)}
            >
              <Text style={[styles.sheetItemText, styles.sheetCancelText]}>
                Cancel
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

export default TawkCard;

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace('#', '');
  const full =
    normalized.length === 3
      ? normalized
          .split('')
          .map((c) => c + c)
          .join('')
      : normalized;
  const int = parseInt(full, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

function createStyles(t: Theme) {
  return StyleSheet.create({
    card: {
      borderRadius: t.radius.l,
      backgroundColor: t.colors.surface,
      borderWidth: 1,
      borderColor: t.colors.border,
      padding: t.spacing.m,
      marginBottom: t.spacing.m,
      ...t.shadow,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing.s,
      marginBottom: t.spacing.s,
    },
    avatarBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: t.colors.input,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    avatarImg: { width: '100%', height: '100%' },
    headerTextCol: { flex: 1, minWidth: 0 },
    authorLine: { color: t.colors.text },
    authorName: { fontWeight: '700' },
    inlineContext: { color: t.colors.mutedText, fontSize: 12 },
    inlineLink: { color: t.colors.text, fontWeight: '700' },
    metaLine: { color: t.colors.mutedText, fontSize: 12, marginTop: 2 },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing.s,
    },
    heardPill: {
      width: 18,
      height: 18,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.colors.input,
    },
    durationPill: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: t.colors.input,
    },
    durationText: {
      fontSize: 12,
      color: t.colors.mutedText,
      fontWeight: '600',
    },

    titleRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: t.spacing.s,
    },
    title: {
      flex: 1,
      fontSize: 16,
      fontWeight: '700',
      color: t.colors.text,
    },
    moreText: {
      fontSize: 20,
      color: t.colors.mutedText,
      paddingHorizontal: 6,
    },
    description: {
      color: t.colors.mutedText,
      marginTop: 6,
      marginBottom: t.spacing.s,
    },

    playerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing.s,
      backgroundColor: hexToRgba(t.colors.primary, 0.08),
      borderRadius: t.radius.l,
      padding: 12,
      marginTop: 4,
      marginBottom: t.spacing.s,
      borderWidth: 1,
      borderColor: hexToRgba(t.colors.primary, 0.18),
    },
    playBtn: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    playBtnActive: { backgroundColor: t.colors.primary },
    playBtnIdle: { backgroundColor: t.colors.input },

    waveWrap: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 2,
      height: 34,
    },
    waveBar: { width: 3, borderRadius: 999 },
    waveBarActive: { backgroundColor: t.colors.primary },
    waveBarIdle: { backgroundColor: hexToRgba(t.colors.mutedText, 0.35) },

    actionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing.s,
    },
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

    commentsWrap: {
      marginTop: t.spacing.s,
      paddingTop: t.spacing.s,
      borderTopWidth: 1,
      borderTopColor: t.colors.border,
      gap: t.spacing.s,
    },
    emptyText: { color: t.colors.mutedText, fontSize: 12 },
    commentRow: {
      flexDirection: 'row',
      gap: t.spacing.s,
      alignItems: 'flex-start',
    },
    commentAvatar: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: t.colors.input,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    commentAvatarImg: { width: '100%', height: '100%' },
    commentBody: { flex: 1 },
    commentAuthor: {
      fontSize: 12,
      fontWeight: '700',
      color: t.colors.text,
    },
    commentText: { fontSize: 12, color: t.colors.text, marginTop: 2 },

    commentInputRow: {
      flexDirection: 'row',
      gap: t.spacing.s,
      alignItems: 'center',
    },
    commentInput: {
      flex: 1,
      backgroundColor: t.colors.input,
      borderRadius: t.radius.m,
      paddingHorizontal: 12,
      paddingVertical: 10,
      color: t.colors.text,
    },
    sendBtn: {
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: t.radius.m,
      backgroundColor: t.colors.primary,
    },
    sendBtnDisabled: { opacity: 0.5 },
    sendBtnText: {
      color: t.colors.surface,
      fontWeight: '800',
      fontSize: 12,
    },

    modalScreen: { flex: 1, backgroundColor: t.colors.surface },
    modalHeader: {
      paddingTop: 56,
      paddingHorizontal: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: t.colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: t.colors.surface,
    },
    modalTitle: { fontSize: 18, fontWeight: '800', color: t.colors.text },
    modalClose: { color: t.colors.text, fontWeight: '700' },
    modalContent: { padding: 16, gap: t.spacing.s },
    modalHint: { color: t.colors.mutedText },
    modalPrimaryBtn: {
      backgroundColor: t.colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: t.radius.l,
    },
    modalPrimaryBtnText: {
      color: t.colors.surface,
      fontWeight: '800',
      textAlign: 'center',
    },

    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.35)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: t.colors.surface,
      padding: 14,
      borderTopLeftRadius: t.radius.l,
      borderTopRightRadius: t.radius.l,
      gap: t.spacing.s,
      borderTopWidth: 1,
      borderTopColor: t.colors.border,
      ...t.shadow,
    },
    sheetTitle: { fontSize: 16, fontWeight: '800', color: t.colors.text },
    sheetItem: {
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: t.radius.l,
      backgroundColor: t.colors.input,
    },
    sheetItemText: { fontWeight: '700', color: t.colors.text },
    sheetCancel: { backgroundColor: t.colors.text },
    sheetCancelText: { color: t.colors.surface },
  });
}

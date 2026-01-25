import { useTheme } from '@/src/theme/useTheme';
import { useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button } from '@/src/components/button';
import { User } from 'lucide-react-native';
import type { Theme } from '@/src/theme';
import { hexToRgba } from '@/src/utils/hex-to-rgba';
import { Tawk } from '@/src/features/tawk/types/tawk';
import { formatDuration } from '@/src/utils/format-duration';

type PlaybackQueueSheetProps = {
  open: boolean;
  onClose: () => void;
  queue: Tawk[];
  currentIndex: number;
  onPlayItem: (index: number) => void;
  onRemoveItem: (index: number) => void;
};

const PlaybackQueueSheet = ({
  open,
  onClose,
  queue,
  currentIndex,
  onPlayItem,
  onRemoveItem,
}: PlaybackQueueSheetProps) => {
  const t = useTheme();
  const styles = useMemo(() => createStyles(t), [t]);
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.sheetBackdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 10) }]}
          onPress={() => undefined}
        >
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Playback Queue</Text>
            <Button title="Close" variant="ghost" onPress={onClose} />
          </View>

          <FlatList
            data={queue}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => {
              const active = index === currentIndex;
              return (
                <Pressable
                  style={[styles.sheetItem, active && styles.sheetItemActive]}
                  onPress={() => {
                    onPlayItem(index);
                    onClose();
                  }}
                >
                  <View style={styles.sheetAvatar}>
                    {item.author.avatarUrl ? (
                      <Image
                        source={{ uri: item.author.avatarUrl }}
                        style={styles.sheetAvatarImg}
                      />
                    ) : (
                      <User size={16} color={t.colors.mutedText} />
                    )}
                  </View>

                  <View style={styles.sheetTextCol}>
                    <Text numberOfLines={1} style={styles.sheetItemTitle}>
                      {item.title}
                    </Text>
                    <Text numberOfLines={1} style={styles.sheetItemMeta}>
                      {item.author.displayName}
                      {index > 0 ? ' · Reply' : ''}
                    </Text>
                  </View>

                  <View style={styles.sheetRight}>
                    <Text style={styles.sheetTime}>
                      {formatDuration(item.duration)}
                    </Text>
                    <Button
                      title="Remove"
                      variant="ghost"
                      size="sm"
                      onPress={() => onRemoveItem(index)}
                    />
                  </View>
                </Pressable>
              );
            }}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default PlaybackQueueSheet;

function createStyles(t: Theme) {
  return StyleSheet.create({
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

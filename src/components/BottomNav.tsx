import React, { useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import {
  Home,
  MessageCircle,
  Mic,
  Plus,
  Search,
  SlidersHorizontal,
  Users,
  X,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getTheme, type Theme } from '@/src/theme';
import { hexToRgba } from '@/src/utils/hex-to-rgba';

type NavItem = {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  label: string;
  path: string;
};

const leftItems: NavItem[] = [
  { icon: Home, label: 'Feed', path: '/feed' },
  { icon: Search, label: 'Discover', path: '/discover' },
];

const rightItems: NavItem[] = [
  { icon: Users, label: 'Channels', path: '/channels' },
  { icon: SlidersHorizontal, label: 'Studio', path: '/studio' },
];

interface BottomNavProps {
  onRecord?: () => void;
  onCreateRoom?: () => void;
  onFind?: () => void;
  onMessages?: () => void;
}

export function BottomNav({
  onRecord,
  onCreateRoom,
  onFind,
  onMessages,
}: BottomNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const theme = useMemo(() => getTheme(colorScheme), [colorScheme]);
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isFindOpen, setIsFindOpen] = useState(false);

  const items = useMemo(() => ({ left: leftItems, right: rightItems }), []);

  const isActive = (path: string) => {
    if (pathname === path) return true;
    if (path !== '/' && pathname?.startsWith(path + '/')) return true;
    return false;
  };

  const navigate = (path: string) => {
    if (isActive(path)) return;
    setIsMenuOpen(false);
    router.push(path as any);
  };

  const handleFind = () => {
    setIsMenuOpen(false);
    if (onFind) return onFind();
    setIsFindOpen(true);
  };

  const handleCreateRoom = () => {
    setIsMenuOpen(false);
    if (onCreateRoom) return onCreateRoom();
    router.push('/create-room' as any);
  };

  const handleRecord = () => {
    setIsMenuOpen(false);
    if (onRecord) return onRecord();
    router.push('/record' as any);
  };

  const handleMessages = () => {
    setIsMenuOpen(false);
    if (onMessages) return onMessages();
    router.push('/messages' as any);
  };

  return (
    <>
      <Modal
        visible={isFindOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsFindOpen(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setIsFindOpen(false)}
        >
          <Pressable style={styles.modalCard} onPress={() => undefined}>
            <Text style={styles.modalTitle}>Find</Text>
            <Text style={styles.modalBody}>
              Replace this modal with your Find search UI.
            </Text>
            <Pressable
              style={styles.modalCloseBtn}
              onPress={() => setIsFindOpen(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {isMenuOpen && (
        <Pressable
          style={styles.overlay}
          onPress={() => setIsMenuOpen(false)}
        />
      )}

      {isMenuOpen && (
        <View style={[styles.actionMenu, { bottom: 80 + insets.bottom }]}>
          <Pressable style={styles.actionBtnOutline} onPress={handleFind}>
            <Search size={18} />
            <Text style={styles.actionBtnText}>Find</Text>
          </Pressable>

          <Pressable style={styles.actionBtnOutline} onPress={handleCreateRoom}>
            <Users size={18} />
            <Text style={styles.actionBtnText}>Create Room</Text>
          </Pressable>

          <Pressable style={styles.actionBtnOutline} onPress={handleMessages}>
            <MessageCircle size={18} />
            <Text style={styles.actionBtnText}>Messages</Text>
          </Pressable>

          <Pressable style={styles.actionBtnPrimary} onPress={handleRecord}>
            <Mic size={18} color={theme.colors.surface} />
            <Text style={[styles.actionBtnText, styles.actionBtnTextPrimary]}>
              Record
            </Text>
          </Pressable>
        </View>
      )}

      <View style={[styles.nav, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        <View style={styles.navInner}>
          {items.left.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;
            return (
              <Pressable
                key={item.path}
                style={[styles.navItem, active && styles.navItemActive]}
                onPress={() => navigate(item.path)}
              >
                <Icon
                  size={20}
                  color={active ? theme.colors.text : theme.colors.mutedText}
                />
                <Text
                  style={[
                    styles.navLabel,
                    {
                      color: active
                        ? theme.colors.text
                        : theme.colors.mutedText,
                    },
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}

          <Pressable
            style={styles.centerBtnWrap}
            onPress={() => setIsMenuOpen((v) => !v)}
          >
            <View
              style={[
                styles.centerBtn,
                isMenuOpen ? styles.centerBtnOpen : styles.centerBtnClosed,
              ]}
            >
              {isMenuOpen ? <X size={22} /> : <Plus size={22} color="#fff" />}
            </View>
          </Pressable>

          {items.right.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;
            return (
              <Pressable
                key={item.path}
                style={[styles.navItem, active && styles.navItemActive]}
                onPress={() => navigate(item.path)}
              >
                <Icon
                  size={20}
                  color={active ? theme.colors.text : theme.colors.mutedText}
                />
                <Text
                  style={[
                    styles.navLabel,
                    {
                      color: active
                        ? theme.colors.text
                        : theme.colors.mutedText,
                    },
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </>
  );
}

export const BOTTOM_NAV_MARGIN = 88;

function createStyles(t: Theme) {
  return StyleSheet.create({
    overlay: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      zIndex: 40,
    },
    actionMenu: {
      position: 'absolute',
      left: 0,
      right: 0,
      zIndex: 50,
      alignItems: 'center',
      gap: 10,
    },
    actionBtnOutline: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: t.colors.border,
      backgroundColor: t.colors.surface,
      ...Platform.select({
        ios: t.shadow as any,
        android: { elevation: (t.shadow as any)?.elevation ?? 6 },
      }),
    },
    actionBtnPrimary: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 18,
      paddingVertical: 12,
      borderRadius: 999,
      backgroundColor: t.colors.primary,
      ...Platform.select({
        ios: t.shadow as any,
        android: { elevation: (t.shadow as any)?.elevation ?? 8 },
      }),
    },
    actionBtnText: {
      fontSize: 14,
      fontWeight: '600',
      color: t.colors.text,
    },
    actionBtnTextPrimary: {
      color: t.colors.surface,
    },
    nav: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 50,
      borderTopWidth: 1,
      borderTopColor: t.colors.border,
      // glassy background that adapts to theme
      backgroundColor: hexToRgba(t.colors.surface, 0.92),
    },
    navInner: {
      maxWidth: 520,
      alignSelf: 'center',
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      paddingHorizontal: 8,
      paddingTop: 8,
    },
    navItem: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 14,
    },
    navItemActive: {
      backgroundColor: hexToRgba(t.colors.text, 0.06),
    },
    navLabel: {
      marginTop: 4,
      fontSize: 11,
      fontWeight: '600',
    },
    centerBtnWrap: {
      marginTop: -24,
    },
    centerBtn: {
      borderRadius: 999,
      padding: 16,
      transform: [{ rotate: '0deg' }],
      ...Platform.select({
        ios: t.shadow as any,
        android: { elevation: (t.shadow as any)?.elevation ?? 10 },
      }),
    },
    centerBtnClosed: {
      backgroundColor: t.colors.primary,
    },
    centerBtnOpen: {
      backgroundColor: t.colors.input,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.35)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
    },
    modalCard: {
      width: '100%',
      maxWidth: 420,
      borderRadius: 18,
      padding: 16,
      backgroundColor: t.colors.surface,
      borderWidth: 1,
      borderColor: t.colors.border,
      ...t.shadow,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: t.colors.text,
      marginBottom: 6,
    },
    modalBody: {
      fontSize: 14,
      color: t.colors.mutedText,
      marginBottom: 12,
    },
    modalCloseBtn: {
      alignSelf: 'flex-end',
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: t.colors.primary,
    },
    modalCloseText: {
      color: t.colors.surface,
      fontWeight: '700',
    },
  });
}

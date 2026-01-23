import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  Platform,
} from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import {
  Home,
  Search,
  Users,
  Plus,
  X,
  Mic,
  SlidersHorizontal,
  MessageCircle,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  /** If provided, called instead of default navigation to /record */
  onRecord?: () => void;
  /** If provided, called instead of default navigation to /create-room */
  onCreateRoom?: () => void;
  /** If provided, called instead of opening the built-in Find modal */
  onFind?: () => void;
  /** If provided, called instead of default navigation to /messages */
  onMessages?: () => void;
}

/**
 * React Native / Expo Router bottom navigation.
 *
 * Place this inside a layout route (e.g. `app/(tabs)/_layout.tsx`) under `<Slot />`.
 */
export function BottomNav({
  onRecord,
  onCreateRoom,
  onFind,
  onMessages,
}: BottomNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isFindOpen, setIsFindOpen] = useState(false);

  const items = useMemo(() => {
    return { left: leftItems, right: rightItems };
  }, []);

  const navigate = (path: string) => {
    if (isActive(path)) return;
    setIsMenuOpen(false);
    router.push(path as any);
  };

  const isActive = (path: string) => {
    // Exact match is usually fine; for nested routes, treat "startsWith" as active.
    if (pathname === path) return true;
    if (path !== '/' && pathname?.startsWith(path + '/')) return true;
    return false;
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
      {/* Simple Find modal (replace with your real RN component) */}
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

      {/* Expanded menu overlay */}
      {isMenuOpen && (
        <Pressable
          style={styles.overlay}
          onPress={() => setIsMenuOpen(false)}
        />
      )}

      {/* Expanded action menu */}
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
            <Mic size={18} color="#fff" />
            <Text style={[styles.actionBtnText, styles.actionBtnTextPrimary]}>
              Record
            </Text>
          </Pressable>
        </View>
      )}

      {/* Bottom nav */}
      <View
        style={[
          styles.nav,
          {
            paddingBottom: Math.max(insets.bottom, 8),
          },
        ]}
      >
        <View style={styles.navInner}>
          {/* Left items */}
          {items.left.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;
            return (
              <Pressable
                key={item.path}
                style={[styles.navItem, active && styles.navItemActive]}
                onPress={() => navigate(item.path)}
              >
                <Icon size={20} color={active ? '#111' : '#6b7280'} />
                <Text
                  style={[
                    styles.navLabel,
                    { color: active ? '#111' : '#6b7280' },
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}

          {/* Center action button */}
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

          {/* Right items */}
          {items.right.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;
            return (
              <Pressable
                key={item.path}
                style={[styles.navItem, active && styles.navItemActive]}
                onPress={() => navigate(item.path)}
              >
                <Icon size={20} color={active ? '#111' : '#6b7280'} />
                <Text
                  style={[
                    styles.navLabel,
                    { color: active ? '#111' : '#6b7280' },
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

const styles = StyleSheet.create({
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
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    // subtle shadow
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 6 },
    }),
  },
  actionBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: '#111827',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.18,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 8 },
      },
      android: { elevation: 8 },
    }),
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  actionBtnTextPrimary: {
    color: '#fff',
  },
  nav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: 'rgba(255,255,255,0.92)',
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
    backgroundColor: 'rgba(0,0,0,0.04)',
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
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.22,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 10 },
      },
      android: { elevation: 10 },
    }),
  },
  centerBtnClosed: {
    backgroundColor: '#111827',
  },
  centerBtnOpen: {
    backgroundColor: '#e5e7eb',
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
    backgroundColor: '#fff',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  modalBody: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 12,
  },
  modalCloseBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#111827',
  },
  modalCloseText: {
    color: '#fff',
    fontWeight: '700',
  },
});

import { useTheme } from '@/src/theme/useTheme';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { Theme } from '@/src/theme';
import { hexToRgba } from '@/src/utils/hex-to-rgba';

const Waveform = ({
  active,
  isPlaying,
}: {
  active: boolean;
  isPlaying: boolean;
}) => {
  const t = useTheme();
  const styles = useMemo(() => createStyles(t), [t]);

  const [width, setWidth] = useState(0);

  const BAR_WIDTH = 3;
  const BAR_GAP = 2;

  const barsCount = useMemo(() => {
    if (!width) return 0;
    return Math.max(8, Math.floor(width / (BAR_WIDTH + BAR_GAP)));
  }, [width]);

  const bars = useMemo(
    () => Array.from({ length: barsCount }, (_, i) => i),
    [barsCount],
  );

  const animValsRef = useRef<Animated.Value[]>([]);
  if (animValsRef.current.length !== bars.length) {
    animValsRef.current = bars.map(() => new Animated.Value(0.35));
  }

  useEffect(() => {
    const anims = animValsRef.current;

    if (!isPlaying) {
      // stop animations and reset to a calm baseline
      anims.forEach((v) => v.stopAnimation());
      Animated.parallel(
        anims.map((v) =>
          Animated.timing(v, {
            toValue: 0.35,
            duration: 180,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ),
      ).start();
      return;
    }

    // when active, animate each bar with a slightly different rhythm
    const loops = anims.map((v, i) => {
      const d1 = 280 + (i % 7) * 35;
      const d2 = 240 + (i % 5) * 30;
      const hi = 1.0;
      const lo = 0.25 + (i % 3) * 0.06;
      return Animated.loop(
        Animated.sequence([
          Animated.timing(v, {
            toValue: hi,
            duration: d1,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(v, {
            toValue: lo,
            duration: d2,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      );
    });

    loops.forEach((l, i) => {
      // tiny stagger so it looks like motion across the wave
      setTimeout(() => l.start(), i * 12);
    });

    return () => {
      loops.forEach((l) => l.stop());
      anims.forEach((v) => v.stopAnimation());
    };
  }, [active, bars, isPlaying]);

  return (
    <View
      style={styles.waveWrap}
      onLayout={(e: LayoutChangeEvent) => {
        setWidth(e.nativeEvent.layout.width);
      }}
    >
      {bars.map((i) => {
        const h = 10 + Math.abs(Math.sin(i * 0.55)) * 18;
        return (
          <Animated.View
            key={i}
            style={[
              styles.waveBar,
              { height: h },
              active ? styles.waveBarActive : styles.waveBarIdle,
              {
                transform: [{ scaleY: animValsRef.current[i] }],
              },
            ]}
          />
        );
      })}
    </View>
  );
};

export default Waveform;

function createStyles(t: Theme) {
  return StyleSheet.create({
    waveWrap: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      height: 34,
    },
    waveBar: { width: 3, borderRadius: 999 },
    waveBarActive: { backgroundColor: t.colors.primary },
    waveBarIdle: { backgroundColor: hexToRgba(t.colors.mutedText, 0.35) },
  });
}

import React, { useMemo } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '@/src/theme/useTheme';
import type { Theme } from '@/src/theme';
import { hexToRgba } from '@/src/utils/hex-to-rgba';

export type ButtonVariant =
  | 'default'
  | 'secondary'
  | 'destructive'
  | 'outline'
  | 'ghost'
  | 'link';

export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

type Props = Omit<PressableProps, 'style'> & {
  title?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  left?: React.ReactNode;
  right?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

/**
 * Button with shadcn-style variants/sizes.
 *
 * Variants: default | secondary | destructive | outline | ghost | link
 * Sizes: default | sm | lg | icon
 */
export function Button({
  title,
  variant = 'default',
  size = 'default',
  left,
  right,
  style,
  textStyle,
  disabled,
  ...rest
}: Props) {
  const t = useTheme();
  const styles = useMemo(() => createStyles(t), [t]);

  const v = styles.variants[variant];
  const s = styles.sizes[size];

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        v.container,
        s.container,
        pressed && v.pressed,
        disabled && styles.disabled,
        style,
      ]}
      {...rest}
    >
      <View style={[styles.contentRow, s.contentRow]}>
        {left ? <View style={styles.side}>{left}</View> : null}
        {title ? (
          <Text
            numberOfLines={1}
            style={[
              styles.baseText,
              v.text,
              s.text,
              disabled && styles.disabledText,
              textStyle,
            ]}
          >
            {title}
          </Text>
        ) : null}
        {right ? <View style={styles.side}>{right}</View> : null}
      </View>
    </Pressable>
  );
}

/** Backwards-compatible export */
export function PrimaryButton(
  props: Omit<Props, 'variant'> & { title: string },
) {
  return <Button {...props} variant="default" />;
}

function createStyles(t: Theme) {
  // shadcn-ish defaults mapped to your theme tokens
  const primaryBg = t.colors.primary;
  const primaryFg = t.colors.surface;

  const secondaryBg = t.colors.input;
  const secondaryFg = t.colors.text;

  const destructiveBg = t.colors.danger;
  const destructiveFg = t.colors.surface;

  const outlineBg = 'transparent';
  const outlineFg = t.colors.text;

  const ghostBg = 'transparent';
  const ghostFg = t.colors.text;

  const linkBg = 'transparent';
  const linkFg = t.colors.primary;

  const pressedOverlay = hexToRgba(t.colors.text, 0.06);

  return {
    ...StyleSheet.create({
      base: {
        borderRadius: t.radius.m,
        alignSelf: 'flex-start',
        overflow: 'hidden',
      },
      contentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
      },
      side: {
        alignItems: 'center',
        justifyContent: 'center',
      },
      baseText: {
        fontWeight: '700',
      },
      disabled: {
        opacity: 0.5,
      },
      disabledText: {
        opacity: 0.85,
      },
    }),

    // Variants
    variants: {
      default: StyleSheet.create({
        container: {
          backgroundColor: primaryBg,
          borderWidth: 1,
          borderColor: primaryBg,
        },
        text: {
          color: primaryFg,
        },
        pressed: {
          opacity: 0.92,
        },
      }),

      secondary: StyleSheet.create({
        container: {
          backgroundColor: secondaryBg,
          borderWidth: 1,
          borderColor: t.colors.border,
        },
        text: {
          color: secondaryFg,
        },
        pressed: {
          backgroundColor: hexToRgba(t.colors.text, 0.04),
        },
      }),

      destructive: StyleSheet.create({
        container: {
          backgroundColor: destructiveBg,
          borderWidth: 1,
          borderColor: destructiveBg,
        },
        text: {
          color: destructiveFg,
        },
        pressed: {
          opacity: 0.9,
        },
      }),

      outline: StyleSheet.create({
        container: {
          backgroundColor: outlineBg,
          borderWidth: 1,
          borderColor: t.colors.border,
        },
        text: {
          color: outlineFg,
        },
        pressed: {
          backgroundColor: pressedOverlay,
        },
      }),

      ghost: StyleSheet.create({
        container: {
          backgroundColor: ghostBg,
          borderWidth: 0,
        },
        text: {
          color: ghostFg,
        },
        pressed: {
          backgroundColor: pressedOverlay,
        },
      }),

      link: StyleSheet.create({
        container: {
          backgroundColor: linkBg,
          borderWidth: 0,
        },
        text: {
          color: linkFg,
          textDecorationLine: 'underline',
        },
        pressed: {
          opacity: 0.75,
        },
      }),
    } satisfies Record<
      ButtonVariant,
      { container: ViewStyle; text: TextStyle; pressed: ViewStyle }
    >,

    // Sizes
    sizes: {
      default: StyleSheet.create({
        container: {
          paddingVertical: 10,
          paddingHorizontal: 14,
          minHeight: 40,
        },
        text: {
          fontSize: 14,
        },
        contentRow: {
          minHeight: 20,
        },
      }),

      sm: StyleSheet.create({
        container: {
          paddingVertical: 8,
          paddingHorizontal: 12,
          minHeight: 34,
        },
        text: {
          fontSize: 13,
        },
        contentRow: {
          minHeight: 18,
        },
      }),

      lg: StyleSheet.create({
        container: {
          paddingVertical: 12,
          paddingHorizontal: 16,
          minHeight: 44,
        },
        text: {
          fontSize: 15,
        },
        contentRow: {
          minHeight: 22,
        },
      }),

      icon: StyleSheet.create({
        container: {
          width: 40,
          height: 40,
          paddingVertical: 0,
          paddingHorizontal: 0,
          alignItems: 'center',
          justifyContent: 'center',
        },
        text: {
          fontSize: 0,
        },
        contentRow: {
          minHeight: 0,
        },
      }),
    } satisfies Record<
      ButtonSize,
      { container: ViewStyle; text: TextStyle; contentRow: ViewStyle }
    >,
  };
}

import { StyleSheet } from 'react-native';
import { theme } from '../theme';

export const commonStyles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: theme.spacing.m,
    backgroundColor: theme.colors.background,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.m,
    padding: theme.spacing.m,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow,
  },
});

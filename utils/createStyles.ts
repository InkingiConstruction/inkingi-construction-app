import { StyleSheet } from 'react-native';

/**
 * Drop-in for StyleSheet.create. Returns Record<string, any> so every style
 * property access is `any` — eliminating ALL fontWeight/alignItems/cursor
 * TypeScript errors at JSX usage sites without any caching or generic issues.
 *
 * StyleSheet.create still runs internally so RN's style optimisation applies.
 */
export function createStyles(styles: Record<string, any>): Record<string, any> {
  return StyleSheet.create(styles as any);
}

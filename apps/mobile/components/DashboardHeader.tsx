import { StyleSheet, TouchableOpacity, Image, View, Text, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, usePathname } from 'expo-router';
import { useAuthStore } from '@/store/auth';
import { useThemeColors, spacing, typography, darkColors, lightColors } from '@/theme';

const logoDark = require('@/assets/images/logo-dark.png');
const logoLight = require('@/assets/images/logo-light.png');

export function DashboardHeader() {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const colors = useThemeColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== 'light';
  const pathname = usePathname();
  
  const isProfilePage = pathname.includes('profile');
  
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';
  const hasCollegeLogo = !!user?.college_logo_url;

  return (
    <View style={[styles.headerContainer, { backgroundColor: colors.header }]}>
      <View
        style={[styles.container, { paddingTop: Math.max(insets.top, 12) }]}
      >
        <View style={styles.logoRow}>
          <Image 
            source={isDark ? logoDark : logoLight} 
            style={styles.appLogo} 
            resizeMode="contain" 
          />
          {hasCollegeLogo && (
            <>
              <View style={[styles.separator, { backgroundColor: colors.border }]} />
              <Image
                source={{ uri: user!.college_logo_url! }}
                style={styles.collegeLogo}
                resizeMode="contain"
              />
            </>
          )}
        </View>
        {!isProfilePage && (
          <TouchableOpacity
            style={styles.avatarButton}
            onPress={() => router.push('/(tabs)/profile-card')}
            activeOpacity={0.8}
          >
            <View style={[styles.avatarCircle, { backgroundColor: colors.primary, borderColor: colors.glow }]}>
              <Text style={[styles.initials, { color: colors.textOnPrimary }]}>{initials}</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    minHeight: 44,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appLogo: {
    width: 100,
    height: 32,
  },
  separator: {
    width: 1,
    height: 24,
    marginHorizontal: spacing.sm,
  },
  collegeLogo: {
    width: 48,
    height: 48,
  },
  avatarButton: {
    padding: 2,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  initials: {
    fontSize: 13,
    fontWeight: '600',
  },
});

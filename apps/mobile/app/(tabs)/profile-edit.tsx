import { useState } from 'react';
import {
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  View,
  Text,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
import { ENDPOINTS } from '@attend/shared';
import { userSchema } from '@attend/shared';
import { useAuthStore } from '@/store/auth';
import { GlassCard, GlassButton, GlassInput } from '@/components/ui';
import { useThemeColors, colors as staticColors, spacing, typography } from '@/theme';

export default function ProfileEditScreen() {
  const { user, token, setAuth } = useAuthStore();
  const colors = useThemeColors();
  const [name, setName] = useState(user?.name ?? '');
  const [contactNumber, setContactNumber] = useState(user?.contact_number ?? '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    const trimmedName = name.trim();
    const trimmedContact = contactNumber.trim();
    if (!trimmedName || !trimmedContact) {
      Alert.alert('Required', 'Please enter both name and contact number.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.patch(ENDPOINTS.ME, {
        name: trimmedName,
        contact_number: trimmedContact,
      });
      const parsed = userSchema.safeParse(data);
      if (parsed.success) {
        setAuth(token!, parsed.data);
      }
      router.back();
    } catch (e: any) {
      Alert.alert(
        'Error',
        e.response?.data?.detail || 'Failed to update profile'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.textPrimary }]}>Edit Profile</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>Update your name and contact number</Text>

        <GlassCard style={styles.formCard}>
          <GlassInput
            label="Name"
            placeholder="Your full name"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            leftIcon={
              <Ionicons
                name="person-outline"
                size={20}
                color={colors.textMuted}
              />
            }
          />
          <GlassInput
            label="Contact Number"
            placeholder="Your phone number"
            value={contactNumber}
            onChangeText={setContactNumber}
            keyboardType="phone-pad"
            leftIcon={
              <Ionicons
                name="call-outline"
                size={20}
                color={colors.textMuted}
              />
            }
          />
        </GlassCard>

        <GlassButton
          variant="primary"
          size="lg"
          onPress={handleSave}
          loading={loading}
          disabled={loading}
          style={styles.saveButton}
        >
          Save Changes
        </GlassButton>

        <GlassButton variant="ghost" size="md" onPress={() => router.back()}>
          Cancel
        </GlassButton>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    justifyContent: 'center',
    flexGrow: 1,
  },
  title: {
    ...typography.h1,
    color: staticColors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: staticColors.textMuted,
    marginBottom: spacing.xl,
  },
  formCard: {
    marginBottom: spacing.xl,
  },
  saveButton: {
    marginBottom: spacing.md,
  },
});

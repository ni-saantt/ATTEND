import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { DashboardHeader } from '@/components/DashboardHeader';
import { api } from '@/lib/api';
import { ENDPOINTS } from '@attend/shared';
import { userSchema } from '@attend/shared';
import { useAuthStore } from '@/store/auth';
import { useThemeColors } from '@/theme';

export default function TabLayout() {
  const { token, setAuth } = useAuthStore();
  const colors = useThemeColors();

  useEffect(() => {
    if (!token) return;
    api
      .get(ENDPOINTS.ME)
      .then(({ data }) => {
        const parsed = userSchema.safeParse(data);
        if (parsed.success) setAuth(token!, parsed.data);
      })
      .catch(() => {});
  }, [token]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <DashboardHeader />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarStyle: {
            backgroundColor: colors.tabBar,
            borderTopWidth: 0,
            elevation: 0,
            shadowOpacity: 0,
          },
          headerShown: false,
          animation: 'fade',
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="enroll"
          options={{
            title: 'Enroll',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person-add" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="attendance"
          options={{
            title: 'Attendance',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="camera" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="reports"
          options={{
            title: 'Reports',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="document-text" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{ href: null, title: 'Profile' }}
        />
        <Tabs.Screen
          name="profile-card"
          options={{ href: null, title: 'Profile' }}
        />
        <Tabs.Screen
          name="profile-edit"
          options={{ href: null, title: 'Edit Profile' }}
        />
        <Tabs.Screen name="two" options={{ href: null }} />
        <Tabs.Screen name="enroll-camera" options={{ href: null }} />
        <Tabs.Screen name="attendance-camera" options={{ href: null }} />
        <Tabs.Screen name="student-list" options={{ href: null }} />
        <Tabs.Screen name="edit-student" options={{ href: null }} />
        <Tabs.Screen name="add-face-camera" options={{ href: null }} />
        <Tabs.Screen name="create-department-admin" options={{ href: null }} />
        <Tabs.Screen name="create-teacher" options={{ href: null }} />
        <Tabs.Screen name="reports-detail" options={{ href: null }} />
        <Tabs.Screen name="attendance-record-detail" options={{ href: null }} />
        <Tabs.Screen name="manage-sections" options={{ href: null }} />
        <Tabs.Screen name="section-students" options={{ href: null }} />
        <Tabs.Screen name="teacher-list" options={{ href: null }} />
        <Tabs.Screen name="department-hub" options={{ href: null }} />
        <Tabs.Screen name="manage-sections-detail" options={{ href: null }} />
        <Tabs.Screen name="section-students-detail" options={{ href: null }} />
        <Tabs.Screen name="section-students-list" options={{ href: null }} />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

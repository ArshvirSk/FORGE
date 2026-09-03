import { Stack, useRouter, ErrorBoundaryProps } from 'expo-router';
import { View, Text, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { LogBox, Platform } from 'react-native';
import { ThemeProvider, DarkTheme } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import { Colors } from '@/constants/theme';
import { useProjectsStore } from '@/store/projects';
import { useGymStore } from '@/store/gym';
import { useNotifications } from '@/hooks/useNotifications';
import { CustomSplashScreen } from '@/components/CustomSplashScreen';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Ignore the push notification error in Expo Go, as we only use local notifications
LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications',
  '`expo-notifications` functionality is not fully supported in Expo Go',
]);

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg, padding: 24, paddingTop: 60 }}>
      <Text style={{ color: Colors.error, fontSize: 24, fontWeight: 'bold' }}>App Crash Details</Text>
      <Text style={{ color: Colors.textSecondary, marginTop: 16 }}>Please share this exact error message:</Text>
      <ScrollView style={{ flex: 1, marginTop: 16, backgroundColor: '#000', padding: 16, borderRadius: 8 }}>
        <Text style={{ color: '#fff', fontFamily: 'monospace', fontSize: 12 }}>
          {error.name}: {error.message}
          {'\n\n'}
          {error.stack}
        </Text>
      </ScrollView>
      <Text style={{ color: Colors.accent, marginTop: 16, textAlign: 'center', padding: 16, fontSize: 16, fontWeight: 'bold' }} onPress={retry}>
        Tap to Retry
      </Text>
    </View>
  );
}

export default function RootLayout() {
  const router = useRouter();
  const initDefaults = useProjectsStore((s) => s.initDefaults);
  const initGym = useGymStore((s) => s.initDefaults);
  const { requestPermissions, rescheduleAll } = useNotifications();
  const responseListenerRef = useRef<Notifications.Subscription | null>(null);

  const [isAppReady, setIsAppReady] = useState(false);
  const [isSplashAnimationComplete, setIsSplashAnimationComplete] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        initDefaults();
        initGym();
      } catch (e) {
        console.warn(e);
      } finally {
        setIsAppReady(true);
      }
    }
    prepare();
  }, []);

  // Hide the native splash screen once the app is ready
  useEffect(() => {
    if (isAppReady) {
      SplashScreen.hideAsync().catch(() => {
        // May fail if already hidden, just ignore
      });
    }
  }, [isAppReady]);

  // Request permissions & reschedule notifications on launch
  useEffect(() => {
    (async () => {
      const granted = await requestPermissions();
      if (granted) {
        await rescheduleAll();
      }
    })();
  }, []);

  // Deep-link handler for notification taps
  useEffect(() => {
    responseListenerRef.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        if (data?.deepLink && typeof data.deepLink === 'string') {
          router.push(data.deepLink as any);
        }
      });

    return () => {
      if (responseListenerRef.current) {
        responseListenerRef.current.remove();
      }
    };
  }, [router]);

  return (
    <ThemeProvider value={{ ...DarkTheme, colors: { ...DarkTheme.colors, background: Colors.bg } }}>
      <View style={{ flex: 1, backgroundColor: Colors.bg }}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors.bg },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
          <Stack.Screen
            name="focus"
            options={{
              presentation: 'fullScreenModal',
              animation: 'fade',
            }}
          />
          <Stack.Screen
            name="add-task"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="notification-settings"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="gym-templates"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="gym-workout"
            options={{
              presentation: 'fullScreenModal',
              animation: 'fade',
            }}
          />
          <Stack.Screen
            name="gym-history"
            options={{
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="gym-session-detail"
            options={{
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="gym-exercise-detail"
            options={{
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="gym-preferences"
            options={{
              animation: 'slide_from_bottom',
              presentation: 'modal',
            }}
          />
          <Stack.Screen
            name="gym-ai-preview"
            options={{
              animation: 'slide_from_bottom',
              presentation: 'modal',
            }}
          />
        </Stack>

        {!isSplashAnimationComplete && isAppReady && (
          <CustomSplashScreen onAnimationComplete={() => setIsSplashAnimationComplete(true)} />
        )}
      </View>
    </ThemeProvider>
  );
}


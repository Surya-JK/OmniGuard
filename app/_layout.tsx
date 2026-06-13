import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { Platform, Alert } from 'react-native';

// Polyfill Alert.alert for React Native Web
if (Platform.OS === 'web') {
  Alert.alert = (title, message) => {
    if (typeof window !== 'undefined') {
      window.alert(title + (message ? '\n\n' + message : ''));
    }
  };
}

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Inject Ionicons font face for web environments using a highly reliable CDN
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const iconFontStyles = `
    @font-face {
      font-family: 'ionicons';
      src: url('https://unpkg.com/react-native-vector-icons@10.0.0/Fonts/Ionicons.ttf') format('truetype');
    }
  `;
  const style = document.createElement('style');
  style.type = 'text/css';
  style.appendChild(document.createTextNode(iconFontStyles));
  document.head.appendChild(style);
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...Ionicons.font,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <>
      <StatusBar style="light" backgroundColor="#0B1120" />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="index" />
      </Stack>
    </>
  );
}
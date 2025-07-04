import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { Platform, LogBox } from 'react-native';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { StorageProvider } from '@/contexts/StorageContext';
import { StatusBar } from './StatusBar';

// Prévenir l'auto-hide du splash screen
SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignorer l'erreur si le splash screen est déjà caché
});

// Ignorer les avertissements non critiques
LogBox.ignoreLogs([
  'Possible Unhandled Promise Rejection',
  'VirtualizedLists should never be nested',
  'AsyncStorage has been extracted from react-native',
  'ViewPropTypes will be removed from React Native',
  'Setting a timer for a long period of time'
]);

export default function RootLayout() {
  useFrameworkReady();

  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      setTimeout(() => {
        SplashScreen.hideAsync().catch(() => {});
      }, 100);
    }
  }, [fontsLoaded, fontError]);

  // Attendre que les polices soient chargées
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <ThemeProvider>
      <LanguageProvider>
        <StorageProvider>
          <Stack 
            screenOptions={{ 
              headerShown: false,
              animation: Platform.OS === 'web' ? 'none' : 'default',
              animationDuration: Platform.OS === 'web' ? 0 : 200,
              presentation: 'card'
            }}
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar />
        </StorageProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
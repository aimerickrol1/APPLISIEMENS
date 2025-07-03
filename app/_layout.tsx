import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { storage } from '@/utils/storage';
import { Platform } from 'react-native';

// Prévenir l'auto-hide du splash screen
SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignorer l'erreur si le splash screen est déjà caché
});

export default function RootLayout() {
  useFrameworkReady();

  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  useEffect(() => {
    // Initialiser le stockage au démarrage de l'application
    const initializeApp = async () => {
      try {
        console.log('Initialisation de l\'application...');
        await storage.initialize();
        console.log('Stockage initialisé avec succès');
      } catch (error) {
        console.error('Erreur lors de l\'initialisation du stockage:', error);
        // Ne pas bloquer l'application en cas d'erreur de stockage
      }
    };

    initializeApp();
  }, []);

  useEffect(() => {
    const hideSplashScreen = async () => {
      if (fontsLoaded || fontError) {
        try {
          await SplashScreen.hideAsync();
          console.log('Splash screen caché avec succès');
        } catch (error) {
          console.error('Erreur lors du masquage du splash screen:', error);
        }
      }
    };

    hideSplashScreen();
  }, [fontsLoaded, fontError]);

  // Attendre que les polices soient chargées avant de rendre l'application
  if (!fontsLoaded && !fontError) {
    return null;
  }

  // Si erreur de chargement des polices, continuer quand même
  if (fontError) {
    console.warn('Erreur de chargement des polices:', fontError);
  }

  return (
    <ThemeProvider>
      <LanguageProvider>
        <Stack 
          screenOptions={{ 
            headerShown: false,
            animation: Platform.OS === 'web' ? 'none' : 'slide_from_right',
            animationDuration: Platform.OS === 'web' ? 0 : 300,
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </LanguageProvider>
    </ThemeProvider>
  );
}
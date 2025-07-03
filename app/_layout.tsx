import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Platform, View } from 'react-native';

// Prévenir l'auto-hide du splash screen
SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignorer l'erreur si le splash screen est déjà caché
});

export default function RootLayout() {
  useFrameworkReady();
  const [isReady, setIsReady] = useState(false);

  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  useEffect(() => {
    const prepareApp = async () => {
      try {
        // Attendre que les polices soient chargées
        if (fontsLoaded || fontError) {
          // Délai minimal pour s'assurer que tout est stable
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Marquer l'app comme prête
          setIsReady(true);
          
          // Cacher le splash screen
          await SplashScreen.hideAsync();
        }
      } catch (error) {
        console.error('Erreur lors de la préparation de l\'app:', error);
        // En cas d'erreur, continuer quand même
        setIsReady(true);
        SplashScreen.hideAsync().catch(() => {});
      }
    };

    prepareApp();
  }, [fontsLoaded, fontError]);

  // Ne rien rendre tant que l'app n'est pas prête
  if (!isReady) {
    return null;
  }

  return (
    <ThemeProvider>
      <LanguageProvider>
        <Stack 
          screenOptions={{ 
            headerShown: false,
            animation: Platform?.OS === 'web' ? 'none' : 'slide_from_right',
            animationDuration: Platform?.OS === 'web' ? 0 : 300,
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
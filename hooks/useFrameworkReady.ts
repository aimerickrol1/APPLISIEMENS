import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

declare global {
  interface Window {
    frameworkReady?: () => void;
  }
}

export function useFrameworkReady() {
  const hasCalledReady = useRef(false);
  
  useEffect(() => {
    try {
      // Vérifier si on est dans un environnement web avant d'accéder à window
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.frameworkReady && !hasCalledReady.current) {
        window.frameworkReady();
        hasCalledReady.current = true;
      }
    } catch (error) {
      // Ignorer les erreurs pour éviter de bloquer l'application
      console.warn('Erreur dans useFrameworkReady:', error);
    }
  }, []);
}
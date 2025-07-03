import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'auto';

export interface ThemeColors {
  // Arrière-plans
  background: string;
  surface: string;
  surfaceSecondary: string;
  
  // Textes
  text: string;
  textSecondary: string;
  textTertiary: string;
  
  // Bordures et séparateurs
  border: string;
  separator: string;
  
  // Couleurs Siemens
  primary: string;
  primaryDark: string;
  
  // États
  success: string;
  warning: string;
  error: string;
  
  // Inputs et cartes
  inputBackground: string;
  cardBackground: string;
  
  // Navigation
  tabBarBackground: string;
  tabBarActive: string;
  tabBarInactive: string;
}

export interface Theme {
  mode: 'light' | 'dark';
  colors: ThemeColors;
}

const lightTheme: Theme = {
  mode: 'light',
  colors: {
    background: '#F9FAFB',
    surface: '#FFFFFF',
    surfaceSecondary: '#F3F4F6',
    
    text: '#111827',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    
    border: '#E5E7EB',
    separator: '#F3F4F6',
    
    primary: '#009999',
    primaryDark: '#007A7A',
    
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    
    inputBackground: '#FFFFFF',
    cardBackground: '#FFFFFF',
    
    tabBarBackground: '#009999',
    tabBarActive: '#FFFFFF',
    tabBarInactive: 'rgba(255, 255, 255, 0.6)',
  }
};

const darkTheme: Theme = {
  mode: 'dark',
  colors: {
    background: '#0B1220',
    surface: '#111927',
    surfaceSecondary: '#1C263B',
    
    text: '#F0F4F8',
    textSecondary: '#94A3B8',
    textTertiary: '#64748B',
    
    border: '#1C263B',
    separator: '#1E293B',
    
    primary: '#006D6D',
    primaryDark: '#005555',
    
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    
    inputBackground: '#1C263B',
    cardBackground: '#111927',
    
    tabBarBackground: '#006D6D',
    tabBarActive: '#F0F4F8',
    tabBarInactive: 'rgba(240, 244, 248, 0.6)',
  }
};

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'SIEMENS_THEME_MODE';

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('auto');

  // Déterminer le thème actuel basé sur le mode sélectionné
  const getCurrentTheme = (): Theme => {
    if (themeMode === 'auto') {
      return systemColorScheme === 'dark' ? darkTheme : lightTheme;
    }
    return themeMode === 'dark' ? darkTheme : lightTheme;
  };

  const theme = getCurrentTheme();
  const isDark = theme.mode === 'dark';

  // Charger le mode de thème sauvegardé de manière TRÈS robuste
  useEffect(() => {
    let isMounted = true;
    
    const loadThemeMode = async () => {
      try {
        // Délai pour s'assurer que l'app est complètement initialisée
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (!isMounted) return;
        
        const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedMode && ['light', 'dark', 'auto'].includes(savedMode) && isMounted) {
          setThemeModeState(savedMode as ThemeMode);
        }
      } catch (error) {
        console.error('Erreur lors du chargement du mode de thème:', error);
        // En cas d'erreur, garder le mode 'auto' par défaut
      }
    };

    // Charger de manière asynchrone sans bloquer le rendu initial
    loadThemeMode();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Sauvegarder le mode de thème de manière non-bloquante
  const setThemeMode = (mode: ThemeMode) => {
    try {
      setThemeModeState(mode);
      // Sauvegarder de manière asynchrone sans attendre
      AsyncStorage.setItem(THEME_STORAGE_KEY, mode).catch(error => {
        console.error('Erreur lors de la sauvegarde du mode de thème:', error);
      });
    } catch (error) {
      console.error('Erreur lors du changement de mode de thème:', error);
    }
  };

  // TOUJOURS rendre immédiatement avec le thème par défaut
  return (
    <ThemeContext.Provider value={{ theme, themeMode, setThemeMode, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
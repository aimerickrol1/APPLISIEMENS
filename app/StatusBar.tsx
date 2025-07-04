import React from 'react';
import { StatusBar as RNStatusBar, Platform } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

export function StatusBar() {
  const { theme } = useTheme();
  
  if (Platform.OS === 'web') {
    return null;
  }
  
  return (
    <RNStatusBar 
      backgroundColor={theme.colors.surface}
      barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'}
      translucent={false}
    />
  );
}
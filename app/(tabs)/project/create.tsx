import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { Wind, ShieldAlert, Combine } from 'lucide-react-native';
import { Header } from '@/components/Header';
import { Input } from '@/components/Input';
import { DateInput } from '@/components/DateInput';
import { Button } from '@/components/Button';
import { useStorage } from '@/contexts/StorageContext';
import { useLanguage } from '@/contexts/LanguageContext';

export default function CreateProjectScreen() {
  const { strings } = useLanguage();
  const { storage } = useStorage();
  const { theme } = useTheme();
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [mode, setMode] = useState<'smoke' | 'compartment' | 'complete'>('smoke');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; startDate?: string; endDate?: string }>({});

  const handleBack = () => {
    router.push('/(tabs)/');
  };

  const validateForm = () => {
    const newErrors: { name?: string; startDate?: string; endDate?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Le nom du projet est requis';
    }

    if (startDate && !isValidDate(startDate)) {
      newErrors.startDate = 'Format de date invalide (JJ/MM/AAAA)';
    }

    if (endDate && !isValidDate(endDate)) {
      newErrors.endDate = 'Format de date invalide (JJ/MM/AAAA)';
    }

    if (startDate && endDate && isValidDate(startDate) && isValidDate(endDate)) {
      const start = parseDate(startDate);
      const end = parseDate(endDate);
      if (end <= start) {
        newErrors.endDate = 'La date de fin doit être après la date de début';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidDate = (dateString: string): boolean => {
    const regex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    const match = dateString.match(regex);
    if (!match) return false;

    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);

    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && 
           date.getMonth() === month - 1 && 
           date.getDate() === day;
  };

  const parseDate = (dateString: string): Date => {
    const [day, month, year] = dateString.split('/').map(num => parseInt(num, 10));
    return new Date(year, month - 1, day);
  };

  const handleCreate = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const projectData: any = {
        name: name.trim(),
        mode: mode,
      };

      if (city.trim()) {
        projectData.city = city.trim();
      }

      if (startDate && isValidDate(startDate)) {
        projectData.startDate = parseDate(startDate);
      }

      if (endDate && isValidDate(endDate)) {
        projectData.endDate = parseDate(endDate);
      }

      const project = await storage.createProject(projectData);
      router.replace(`/(tabs)/project/${project.id}`);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de créer le projet. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <Header
        title="Nouveau projet"
        onBack={handleBack}
      />
      
      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >      
        {/* Sélection du mode de projet */}
        <View style={styles.modeSelectionContainer}>
          <Text style={styles.modeSelectionTitle}>Mode du projet</Text>
          
          <View style={styles.modeButtonsContainer}>
            <TouchableOpacity 
              style={[
                styles.modeButton, 
                mode === 'smoke' && styles.modeButtonActive
              ]}
              onPress={() => setMode('smoke')}
            >
              <Wind size={24} color={mode === 'smoke' ? '#ffffff' : theme.colors.primary} />
              <Text style={[
                styles.modeButtonTitle,
                mode === 'smoke' && styles.modeButtonTitleActive
              ]}>
                Désenfumage
              </Text>
              <Text style={[
                styles.modeButtonDesc,
                mode === 'smoke' && styles.modeButtonDescActive
              ]}>
                Zones et volets
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.modeButton, 
                mode === 'compartment' && styles.modeButtonActive
              ]}
              onPress={() => setMode('compartment')}
            >
              <ShieldAlert size={24} color={mode === 'compartment' ? '#ffffff' : theme.colors.primary} />
              <Text style={[
                styles.modeButtonTitle,
                mode === 'compartment' && styles.modeButtonTitleActive
              ]}>
                Compartimentage
              </Text>
              <Text style={[
                styles.modeButtonDesc,
                mode === 'compartment' && styles.modeButtonDescActive
              ]}>
                Zones et DAS
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.modeButton, 
                mode === 'complete' && styles.modeButtonActive
              ]}
              onPress={() => setMode('complete')}
            >
              <Combine size={24} color={mode === 'complete' ? '#ffffff' : theme.colors.primary} />
              <Text style={[
                styles.modeButtonTitle,
                mode === 'complete' && styles.modeButtonTitleActive
              ]}>
                Complet
              </Text>
              <Text style={[
                styles.modeButtonDesc,
                mode === 'complete' && styles.modeButtonDescActive
              ]}>
                Tous les éléments
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.modeDescriptionContainer}>
            {mode === 'smoke' && (
              <Text style={styles.modeDescription}>
                <Text style={styles.modeDescriptionHighlight}>Mode Désenfumage :</Text> Gestion des zones de désenfumage (ZF) avec volets hauts (VH) et bas (VB). Idéal pour les projets de contrôle de fumée.
              </Text>
            )}
            
            {mode === 'compartment' && (
              <Text style={styles.modeDescription}>
                <Text style={styles.modeDescriptionHighlight}>Mode Compartimentage :</Text> Gestion des zones de compartimentage (ZC) avec dispositifs actionnés de sécurité (DAS) comme les portes et clapets coupe-feu.
              </Text>
            )}
            
            {mode === 'complete' && (
              <Text style={styles.modeDescription}>
                <Text style={styles.modeDescriptionHighlight}>Mode Complet :</Text> Combine les fonctionnalités de désenfumage et de compartimentage dans un même projet pour une gestion complète.
              </Text>
            )}
          </View>
        </View>
        
        <Input
          label="Nom du projet *"
          value={name}
          onChangeText={setName}
          placeholder="Ex: Mesures centre commercial Rivoli"
          error={errors.name}
        />

        <Input
          label="Ville (optionnel)"
          value={city}
          onChangeText={setCity}
          placeholder="Ex: Paris, Lyon, Marseille"
        />

        <DateInput
          label="Date de début (optionnel)"
          value={startDate}
          onChangeText={setStartDate}
          placeholder="JJ/MM/AAAA"
          error={errors.startDate}
        />

        <DateInput
          label="Date de fin (optionnel)"
          value={endDate}
          onChangeText={setEndDate}
          placeholder="JJ/MM/AAAA"
          error={errors.endDate}
        />

        <View style={styles.buttonContainer}>
          <Button
            title="Créer le projet"
            onPress={handleCreate}
            disabled={loading}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  buttonContainer: {
    marginTop: 24,
  },
  // Styles pour la sélection de mode
  modeSelectionContainer: {
    marginBottom: 24,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modeSelectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  modeButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 16,
  },
  modeButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  modeButtonActive: {
    backgroundColor: '#009999',
    borderColor: '#009999',
  },
  modeButtonTitle: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginTop: 12,
    marginBottom: 4,
  },
  modeButtonTitleActive: {
    color: '#ffffff',
  },
  modeButtonDesc: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
  },
  modeButtonDescActive: {
    color: '#ffffff',
  },
  modeDescriptionContainer: {
    backgroundColor: 'rgba(0, 153, 153, 0.1)',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#009999',
  },
  modeDescription: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 18,
  },
  modeDescriptionHighlight: {
    fontFamily: 'Inter-SemiBold',
    color: '#009999',
  },
});
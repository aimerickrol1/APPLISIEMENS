import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Wind, ShieldAlert, Combine } from 'lucide-react-native';
import { Header } from '@/components/Header';
import { Input } from '@/components/Input';
import { DateInput } from '@/components/DateInput';
import { Button } from '@/components/Button';
import { Project } from '@/types';
import { useStorage } from '@/contexts/StorageContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAndroidBackButton } from '@/utils/BackHandler';

export default function EditProjectScreen() {
  const { strings } = useLanguage();
  const { theme } = useTheme();
  const { projects, updateProject } = useStorage();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [mode, setMode] = useState<'smoke' | 'compartment' | 'complete'>('smoke');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [errors, setErrors] = useState<{ name?: string; startDate?: string; endDate?: string }>({});

  // Configure Android back button to go back to the project screen
  useAndroidBackButton(() => {
    handleBack();
    return true;
  });

  useEffect(() => {
    loadProject();
  }, [id, projects]);

  const formatDate = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const loadProject = async () => {
    try {
      console.log('🔍 Recherche du projet avec ID:', id);
      const foundProject = projects.find(p => p.id === id);
      if (foundProject) {
        console.log('✅ Projet trouvé:', foundProject.name);
        setProject(foundProject);
        setName(foundProject.name);
        setCity(foundProject.city || '');
        setMode(foundProject.mode || 'smoke');
        setStartDate(foundProject.startDate ? formatDate(new Date(foundProject.startDate)) : '');
        setEndDate(foundProject.endDate ? formatDate(new Date(foundProject.endDate)) : '');
      } else {
        console.error('❌ Projet non trouvé avec ID:', id);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du projet:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  // CORRIGÉ : Retourner vers la page du projet (et non la liste des projets)
  const handleBack = () => {
    try {
      if (project) {
        router.push(`/(tabs)/project/${project.id}`);
      } else {
        router.push('/(tabs)/');
      }
    } catch (error) {
      console.error('Erreur de navigation:', error);
      router.push('/(tabs)/');
    }
  };

  const validateForm = () => {
    const newErrors: { name?: string; startDate?: string; endDate?: string } = {};

    if (!name.trim()) {
      newErrors.name = strings.nameRequired;
    }

    if (startDate && !isValidDate(startDate)) {
      newErrors.startDate = strings.invalidDate;
    }

    if (endDate && !isValidDate(endDate)) {
      newErrors.endDate = strings.invalidDate;
    }

    if (startDate && endDate && isValidDate(startDate) && isValidDate(endDate)) {
      const start = parseDate(startDate);
      const end = parseDate(endDate);
      if (end <= start) {
        newErrors.endDate = strings.endDateAfterStart;
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

  const handleSave = async () => {
    if (!validateForm() || !project) return;

    setLoading(true);
    try {
      console.log('💾 Sauvegarde du projet:', project.id);
      
      const updateData: any = {
        name: name.trim(),
        mode: mode,
        city: city.trim() || undefined,
      };

      if (startDate && isValidDate(startDate)) {
        updateData.startDate = parseDate(startDate);
      } else if (!startDate) {
        updateData.startDate = undefined;
      }

      if (endDate && isValidDate(endDate)) {
        updateData.endDate = parseDate(endDate);
      } else if (!endDate) {
        updateData.endDate = undefined;
      }

      const updatedProject = await updateProject(project.id, updateData);

      if (updatedProject) {
        console.log('✅ Projet mis à jour avec succès');
        // CORRIGÉ : Retourner vers la page du projet (et non la liste des projets)
        router.push(`/(tabs)/project/${project.id}`);
      } else {
        console.error('❌ Erreur: Projet non trouvé pour la mise à jour');
      }
    } catch (error) {
      console.error('Erreur lors de la modification du projet:', error);
    } finally {
      setLoading(false);
    }
  };

  const styles = createStyles(theme);

  if (initialLoading) {
    return (
      <View style={styles.container}>
        <Header title={strings.loading} onBack={handleBack} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{strings.loadingData}</Text>
        </View>
      </View>
    );
  }

  if (!project) {
    return (
      <View style={styles.container}>
        <Header title={strings.itemNotFound} onBack={handleBack} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{strings.dataNotFound}</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <Header
        title={strings.editProject}
        onBack={handleBack}
      />
      
      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Affichage du mode (non modifiable après création) */}
        <View style={styles.modeDisplayContainer}>
          <Text style={styles.modeDisplayTitle}>Mode du projet</Text>
          
          <View style={styles.modeDisplay}>
            {mode === 'smoke' && (
              <View style={styles.modeDisplayContent}>
                <Wind size={24} color={theme.colors.primary} />
                <View style={styles.modeDisplayTextContainer}>
                  <Text style={styles.modeDisplayName}>Désenfumage</Text>
                  <Text style={styles.modeDisplayDesc}>Zones et volets</Text>
                </View>
              </View>
            )}
            
            {mode === 'compartment' && (
              <View style={styles.modeDisplayContent}>
                <ShieldAlert size={24} color={theme.colors.primary} />
                <View style={styles.modeDisplayTextContainer}>
                  <Text style={styles.modeDisplayName}>Compartimentage</Text>
                  <Text style={styles.modeDisplayDesc}>Zones et DAS</Text>
                </View>
              </View>
            )}
            
            {mode === 'complete' && (
              <View style={styles.modeDisplayContent}>
                <Combine size={24} color={theme.colors.primary} />
                <View style={styles.modeDisplayTextContainer}>
                  <Text style={styles.modeDisplayName}>Complet</Text>
                  <Text style={styles.modeDisplayDesc}>Désenfumage et compartimentage</Text>
                </View>
              </View>
            )}
            
            <Text style={styles.modeDisplayNote}>Le mode ne peut pas être modifié après la création</Text>
          </View>
        </View>
        
        <Input
          label={`${strings.projectName} *`}
          value={name}
          onChangeText={setName}
          placeholder="Ex: Mesures centre commercial Rivoli"
          error={errors.name}
        />

        <Input
          label={`${strings.city} (${strings.optional})`}
          value={city}
          onChangeText={setCity}
          placeholder="Ex: Paris, Lyon, Marseille"
        />

        <DateInput
          label={`${strings.startDate} (${strings.optional})`}
          value={startDate}
          onChangeText={setStartDate}
          placeholder="JJ/MM/AAAA"
          error={errors.startDate}
        />

        <DateInput
          label={`${strings.endDate} (${strings.optional})`}
          value={endDate}
          onChangeText={setEndDate}
          placeholder="JJ/MM/AAAA"
          error={errors.endDate}
        />

        <View style={styles.buttonContainer}>
          <Button
            title={loading ? "Sauvegarde..." : strings.saveChanges}
            onPress={handleSave}
            disabled={loading}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  buttonContainer: {
    marginTop: 24,
  },
  // Styles pour l'affichage du mode (non modifiable)
  modeDisplayContainer: {
    marginBottom: 24,
  },
  modeDisplayTitle: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  modeDisplay: {
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modeDisplayContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  modeDisplayTextContainer: {
    marginLeft: 16,
  },
  modeDisplayName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  modeDisplayDesc: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
  },
  modeDisplayNote: {
    fontSize: 12,
    fontFamily: 'Inter-Italic',
    color: theme.colors.textTertiary,
    fontStyle: 'italic',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 12,
  },
});
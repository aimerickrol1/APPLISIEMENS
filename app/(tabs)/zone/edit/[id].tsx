import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Header } from '@/components/Header';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Project, Building, FunctionalZone } from '@/types';
import { storage } from '@/utils/storage';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAndroidBackButton } from '@/utils/BackHandler';

export default function EditZoneScreen() {
  const { strings } = useLanguage();
  const { theme } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [zone, setZone] = useState<FunctionalZone | null>(null);
  const [building, setBuilding] = useState<Building | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [errors, setErrors] = useState<{ name?: string }>({});

  // Configure Android back button to go back to the zone screen
  useAndroidBackButton(() => {
    handleBack();
    return true;
  });

  useEffect(() => {
    loadZone();
  }, [id]);

  const loadZone = async () => {
    try {
      const projects = await storage.getProjects();
      for (const proj of projects) {
        for (const bldg of proj.buildings) {
          const foundZone = bldg.functionalZones.find(z => z.id === id);
          if (foundZone) {
            setZone(foundZone);
            setBuilding(bldg);
            setProject(proj);
            setName(foundZone.name);
            setDescription(foundZone.description || '');
            return;
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la zone:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  // CORRIGÉ : Retourner vers la page de la zone (et non du bâtiment)
  const handleBack = () => {
    try {
      if (zone) {
        router.push(`/(tabs)/zone/${zone.id}`);
      } else if (building) {
        router.push(`/(tabs)/building/${building.id}`);
      } else {
        router.push('/(tabs)/');
      }
    } catch (error) {
      console.error('Erreur de navigation:', error);
      router.push('/(tabs)/');
    }
  };

  const validateForm = () => {
    const newErrors: { name?: string } = {};

    if (!name.trim()) {
      newErrors.name = strings.nameRequired;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm() || !zone) return;

    setLoading(true);
    try {
      const updatedZone = await storage.updateFunctionalZone(zone.id, {
        name: name.trim(),
        description: description.trim() || undefined,
      });

      if (updatedZone) {
        // CORRIGÉ : Retourner vers la page de la zone (et non du bâtiment)
        router.push(`/(tabs)/zone/${zone.id}`);
      }
    } catch (error) {
      console.error('Erreur lors de la modification de la zone:', error);
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

  if (!zone || !building || !project) {
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
        title={strings.editZone}
        subtitle={`${building.name} • ${project.name}`}
        onBack={handleBack}
      />
      
      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <Input
          label={`${strings.zoneName} *`}
          value={name}
          onChangeText={setName}
          placeholder="Ex: ZF01, Zone Hall"
          error={errors.name}
        />

        <Input
          label={`${strings.description} (${strings.optional})`}
          value={description}
          onChangeText={setDescription}
          placeholder="Ex: Hall d'entrée principal"
          multiline
          numberOfLines={3}
        />

        <View style={styles.buttonContainer}>
          <Button
            title={strings.saveChanges}
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
});
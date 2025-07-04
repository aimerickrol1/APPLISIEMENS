Here's the fixed version with all missing closing brackets added:

```typescript
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Modal, ScrollView, TextInput, ToastAndroid, Platform } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Plus, Building, Settings, Star, Trash2, SquareCheck as CheckSquare, Square, X, Minus, Calendar, Layers } from 'lucide-react-native';
import { Header } from '@/components/Header';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { DateInput } from '@/components/DateInput';
import { Project } from '@/types';
import { useStorage } from '@/contexts/StorageContext';
import { calculateCompliance } from '@/utils/compliance';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useDoubleBackToExit } from '@/utils/BackHandler';

// Interface pour la structure prédéfinie
interface PredefinedZone {
  id: string;
  name: string;
  highShutters: number;
  lowShutters: number;
}

interface PredefinedBuilding {
  id: string;
  name: string;
  zones: PredefinedZone[];
}

interface PredefinedStructure {
  enabled: boolean;
  buildings: PredefinedBuilding[];
}

export default function ProjectsScreen() {
  const { strings } = useLanguage();
  const { theme } = useTheme();
  const { 
    projects,
    favoriteProjects: favProjects,
    createProject, 
    deleteProject, 
    setFavoriteProjects,
    createBuilding,
    createFunctionalZone,
    createShutter,
    isLoading 
  } = useStorage();
  
  const [loading, setLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [favoriteProjects, setFavoriteProjectsState] = useState<Set<string>>(new Set());
  
  // États pour le mode sélection
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  
  // États du formulaire
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [errors, setErrors] = useState<{ name?: string; startDate?: string; endDate?: string }>({});

  // États pour la prédéfinition de structure
  const [predefinedStructure, setPredefinedStructure] = useState<PredefinedStructure>({
    enabled: false,
    buildings: []
  });

  // Référence pour le ScrollView du modal
  const modalScrollViewRef = useRef<ScrollView>(null);

  // Utiliser le hook pour gérer le double appui sur le bouton retour pour quitter
  useDoubleBackToExit();
  
  // Convertir favoriteProjects array to Set pour .has() method
  useEffect(() => {
    setFavoriteProjectsState(new Set(favProjects));
  }, [favProjects]);

  useEffect(() => {
    setLoading(false);
  }, [projects]);

  // Fonctions pour la prédéfinition de structure
  // Convertir favoriteProjects array to Set pour .has() method
  useEffect(() => {
    setFavoriteProjectsState(new Set(favProjects));
  }, [favProjects]);

  // NOUVEAU : Écouteur d'événement pour ouvrir le modal depuis la page export
  useEffect(() => {
    const handleOpenModal = () => {
      handleCreateModal();
    };

    // Ajouter l'écouteur d'événement seulement sur web
    if (typeof window !== 'undefined') {
      window.addEventListener('openCreateProjectModal', handleOpenModal);
      
      // Nettoyer l'écouteur au démontage
      return () => {
        window.removeEventListener('openCreateProjectModal', handleOpenModal);
      };
    }
  }, []);

  useEffect(() => {
    setLoading(false);
  }, [projects]);

  // Fonctions pour la prédéfinition de structure
  const generateUniqueId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const togglePredefinedStructure = () => {
    setPredefinedStructure(prev => ({
      ...prev,
      enabled: !prev.enabled,
      buildings: prev.enabled ? [] : prev.buildings
    }));
  };

  const addBuilding = () => {
    const newBuilding: PredefinedBuilding = {
      id: generateUniqueId(),
      name: `Bâtiment ${predefinedStructure.buildings.length + 1}`,
      zones: []
    };
    
    setPredefinedStructure(prev => ({
      ...prev,
      buildings: [...prev.buildings, newBuilding]
    }));
  };

  const removeBuilding = (buildingId: string) => {
    setPredefinedStructure(prev => ({
      ...prev,
      buildings: prev.buildings.filter(b => b.id !== buildingId)
    }));
  };

  const updateBuildingName = (buildingId: string, name: string) => {
    setPredefinedStructure(prev => ({
      ...prev,
      buildings: prev.buildings.map(b => 
        b.id === buildingId ? { ...b, name } : b
      )
    }));
  };

  const addZone = (buildingId: string) => {
    const building = predefinedStructure.buildings.find(b => b.id === buildingId);
    const zoneNumber = building ? building.zones.length + 1 : 1;
    
    const newZone: PredefinedZone = {
      id: generateUniqueId(),
      name: `ZF${zoneNumber.toString().padStart(2, '0')}`,
      highShutters: 0,
      lowShutters: 0
    };

    setPredefinedStructure(prev => ({
      ...prev,
      buildings: prev.buildings.map(b => 
        b.id === buildingId 
          ? { ...b, zones: [...b.zones, newZone] }
          : b
      )
    }));
  };

  const removeZone = (buildingId: string, zoneId: string) => {
    setPredefinedStructure(prev => ({
      ...prev,
      buildings: prev.buildings.map(b => 
        b.id === buildingId 
          ? { ...b, zones: b.zones.filter(z => z.id !== zoneId) }
          : b
      )
    }));
  };

  const updateZoneName = (buildingId: string, zoneId: string, name: string) => {
    setPredefinedStructure(prev => ({
      ...prev,
      buildings: prev.buildings.map(b => 
        b.id === buildingId 
          ? { 
              ...b, 
              zones: b.zones.map(z => 
                z.id === zoneId ? { ...z, name } : z
              )
            }
          : b
      )
    }));
  };

  const updateShutterCount = (buildingId: string, zoneId: string, type: 'high' | 'low', count: number) => {
    const clampedCount = Math.max(0, Math.min(30, count));
    
    setPredefinedStructure(prev => ({
      ...prev,
      buildings: prev.buildings.map(b => 
        b.id === buildingId 
          ? { 
              ...b, 
              zones: b.zones.map(z => 
                z.id === zoneId 
                  ? { 
                      ...z, 
                      [type === 'high' ? 'highShutters' : 'lowShutters']: clampedCount 
                    }
                  : z
              )
            }
          : b
      )
    }));
  };

  // Validation du formulaire avec scroll automatique
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

    // Si le champ nom est vide, faire un scroll vers le haut
    if (newErrors.name && modalScrollViewRef.current) {
      setTimeout(() => {
        modalScrollViewRef.current?.scrollTo({ 
          y: 0, 
          animated: true 
        });
      }, 100);
    }

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

  // Création du projet avec structure prédéfinie
  const handleCreateProject = async () => {
    if (!validateForm()) return;

    setFormLoading(true);
    try {
      const projectData: any = {
        name: name.trim(),
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

      // Créer le projet
      const project = await createProject(projectData);

      // Si la prédéfinition est activée, créer la structure
      if (predefinedStructure.enabled && predefinedStructure.buildings.length > 0) {
        for (const buildingData of predefinedStructure.buildings) {
          if (buildingData.name.trim()) {
            const building = await createBuilding(project.id, {
              name: buildingData.name.trim()
            });

            if (building && buildingData.zones.length > 0) {
              for (const zoneData of buildingData.zones) {
                if (zoneData.name.trim()) {
                  const zone = await createFunctionalZone(building.id, {
                    name: zoneData.name.trim()
                  });

                  if (zone) {
                    // Créer les volets hauts (VH)
                    for (let i = 1; i <= zoneData.highShutters; i++) {
                      await createShutter(zone.id, {
                        name: `VH${i.toString().padStart(2, '0')}`,
                        type: 'high',
                        referenceFlow: 0,
                        measuredFlow: 0
                      });
                    }

                    // Créer les volets bas (VB)
                    for (let i = 1; i <= zoneData.lowShutters; i++) {
                      await createShutter(zone.id, {
                        name: `VB${i.toString().padStart(2, '0')}`,
                        type: 'low',
                        referenceFlow: 0,
                        measuredFlow: 0
                      });
                    }
                  }
                }
              }
            }
          }
        }
      }

      // Réinitialiser le formulaire
      resetForm();
      setCreateModalVisible(false);

      // Naviguer vers le projet créé
      router.push(`/(tabs)/project/${project.id}`);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de créer le projet. Veuillez réessayer.');
    } finally {
      setFormLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setCity('');
    setStartDate('');
    setEndDate('');
    setErrors({});
    setPredefinedStructure({
      enabled: false,
      buildings: []
    });
  };

  const handleCreateModal = () => {
    resetForm();
    setCreateModalVisible(true);
  };

  // Fonctions pour les favoris et sélection
  const handleToggleFavorite = async (projectId: string) => {
    const newFavorites = new Set(favoriteProjects);
    if (newFavorites.has(projectId)) {
      newFavorites.delete(projectId);
    } else {
      newFavorites.add(projectId);
    }
    
    await setFavoriteProjects(Array.from(newFavorites));
  };

  const handleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedProjects(new Set());
  };

  const handleProjectSelection = (projectId: string) => {
    const newSelection = new Set(selectedProjects);
    if (newSelection.has(projectId)) {
      newSelection.delete(projectId);
    } else {
      newSelection.add(projectId);
    }
    setSelectedProjects(newSelection);
  };

  const handleBulkDelete = () => {
    if (selectedProjects.size === 0) return;

    Alert.alert(
      'Supprimer les projets',
      `Êtes-vous sûr de vouloir supprimer ${selectedProjects.size} projet${selectedProjects.size > 1 ? 's' : ''} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            for (const projectId of selectedProjects) {
              await deleteProject(projectId);
            }
            setSelectedProjects(new Set());
            setSelectionMode(false);
          }
        }
      ]
    );
  };

  const handleBulkFavorite = async () => {
    if (selectedProjects.size === 0) return;

    const newFavorites = new Set(favoriteProjects);
    for (const projectId of selectedProjects) {
      if (newFavorites.has(projectId)) {
        newFavorites.delete(projectId);
      } else {
        newFavorites.add(projectId);
      }
    }
    
    await setFavoriteProjects(Array.from(newFavorites));
    setSelectedProjects(new Set());
    setSelectionMode(false);
  };

  const handleProjectPress = (project: Project) => {
    if (selectionMode) {
      handleProjectSelection(project.id);
    } else {
      router.push(`/(tabs)/project/${project.id}`);
    }
  };

  const handleDeleteProject = async (project: Project) => {
    Alert.alert(
      'Supprimer le projet',
      `Êtes-vous sûr de vouloir supprimer le projet "${project.name}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await deleteProject(project.id);
          }
        }
      ]
    );
  };

  const handleEditProject = (project: Project) => {
    router.push(`/(tabs)/project/edit/${project.id}`);
  };

  // NOUVEAU : Fonction pour calculer les statistiques détaillées du projet
  const getProjectStats = (project: Project) => {
    const buildingCount = project.buildings.length;
    const zoneCount = project.buildings.reduce((total, building) => total + building.functionalZones.length, 0);
    const shutterCount = project.buildings.reduce((total, building) => 
      total + building.functionalZones.reduce((zoneTotal, zone) => zoneTotal + zone.shutters.length, 0), 0);

    let compliantCount = 0;
    let acceptableCount = 0;
    let nonCompliantCount = 0;

    // Calculer la conformité pour chaque volet
    project.buildings.forEach(building => {
      building.functionalZones.forEach(zone => {
        zone.shutters.forEach(shutter => {
          const compliance = calculateCompliance(shutter.referenceFlow, shutter.measuredFlow);
          switch (compliance.status) {
            case 'compliant':
              compliantCount++;
              break;
            case 'acceptable':
              acceptableCount++;
              break;
            case 'non-compliant':
              nonCompliantCount++;
              break;
          }
        });
      });
    });

    const complianceRate = shutterCount > 0 ? (compliantCount / shutterCount) * 100 : 0;

    return {
      buildingCount,
      zoneCount,
      shutterCount,
      compliantCount,
      acceptableCount,
      nonCompliantCount,
      complianceRate
    };
  };

  // Trier les projets : favoris en premier
  const sortedProjects = [...projects].sort((a, b) => {
    const aIsFavorite = favoriteProjects.has(a.id);
    const bIsFavorite = favoriteProjects.has(b.id);
    
    if (aIsFavorite && !bIsFavorite) return -1;
    if (!aIsFavorite && bIsFavorite) return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const renderProject = ({ item }: { item: Project }) => {
    const isSelected = selectedProjects.has(item.id);
    const isFavorite = favoriteProjects.has(item.id);
    const stats = getProjectStats(item);

    return (
      <TouchableOpacity
        style={[
          styles.projectCard,
          isSelected && styles.selectedCard,
          isFavorite && styles.favoriteCard
        ]}
        onPress={() => handleProjectPress(item)}
        onLongPress={() => {
          if (!selectionMode) {
            setSelectionMode(true);
            handleProjectSelection(item.id);
          }
        }}
      >
        {/* En-tête avec nom du projet et actions */}
        <View style={styles.projectHeader}>
          <View style={styles.projectTitleSection}>
            {selectionMode && (
              <TouchableOpacity 
                style={styles.checkbox}
                onPress={() => handleProjectSelection(item.id)}
              >
                {isSelected ? (
                  <CheckSquare size={20} color={theme.colors.primary} />
                ) : (
                  <Square size={20} color={theme.colors.textTertiary} />
                )}
              </TouchableOpacity>
            )}
            <View style={styles.projectInfo}>
              <Text style={styles.projectName}>{item.name}</Text>
              {item.city && <Text style={styles.projectCity}>{item.city}</Text>}
            </View>
          </View>
          
          {!selectionMode && (
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => handleToggleFavorite(item.id)}
              >
                <Star 
                  size={16} 
                  color={isFavorite ? "#F59E0B" : theme.colors.textTertiary} 
                  fill={isFavorite ? "#F59E0B" : "none"}
                />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => handleEditProject(item)}
              >
                <Settings size={16} color={theme.colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => handleDeleteProject(item)}
              >
                <Trash2 size={16} color={theme.colors.error} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Dates du projet */}
        {(item.startDate || item.endDate) && (
          <View style={styles.projectDates}>
            <Calendar size={14} color={theme.colors.textSecondary} />
            <Text style={styles.dateText}>
              {item.startDate && new Date(item.startDate).toLocaleDateString('fr-FR', { 
                day: 'numeric', 
                month: 'short', 
                year: 'numeric' 
              })}
              {item.startDate && item.endDate && ' → '}
              {item.endDate && new Date(item.endDate).toLocaleDateString('fr-FR', { 
                day: 'numeric', 
                month: 'short', 
                year: 'numeric' 
              })}
            </Text>
          </View>
        )}

        {/* CORRIGÉ : Statistiques principales avec alignement parfait */}
        <View style={styles.mainStats}>
          <View style={styles.statBox}>
            <View style={styles.statIconContainer}>
              <Building size={16} color={theme.colors.primary} />
            </View>
            <Text style={styles.statNumber}>{stats.buildingCount}</Text>
            <Text style={styles.statLabel}>Bâtiments</Text>
          </View>
          
          <View style={styles.statBox}>
            <View style={styles.statIconContainer}>
              <Layers size={16} color={theme.colors.primary} />
            </View>
            <Text style={styles.statNumber}>{stats.zoneCount}</Text>
            <Text style={styles.statLabel}>Zones</Text>
          </View>
          
          <View style={styles.statBox}>
            {/* CORRIGÉ : Point coloré dans un conteneur de même taille que les icônes */}
            <View style={styles.statIconContainer}>
              <View style={[styles.complianceDot, { 
                backgroundColor: stats.complianceRate >= 80 ? '#10B981' : stats.complianceRate >= 60 ? '#F59E0B' : '#EF4444' 
              }]} />
            </View>
            <Text style={[styles.statNumber, { 
              color: stats.complianceRate >= 80 ? '#10B981' : stats.complianceRate >= 60 ? '#F59E0B' : '#EF4444' 
            }]}>
              {stats.complianceRate.toFixed(0)}%
            </Text>
            <Text style={styles.statLabel}>Conformité</Text>
          </View>
        </View>

        {/* Barre de progression de conformité */}
        {stats.shutterCount > 0 && (
          <View style={styles.complianceSection}>
            <Text style={styles.shutterCountText}>{stats.shutterCount} volets</Text>
            
            <View style={styles.complianceBar}>
              <View style={[styles.complianceSegment, { 
                flex: stats.compliantCount, 
                backgroundColor: '#10B981' 
              }]} />
              <View style={[styles.complianceSegment, { 
                flex: stats.acceptableCount, 
                backgroundColor: '#F59E0B' 
              }]} />
              <View style={[styles.complianceSegment, { 
                flex: stats.nonCompliantCount, 
                backgroundColor: '#EF4444' 
              }]} />
            </View>

            <View style={styles.complianceLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
                <Text style={styles.legendText}>{stats.compliantCount} Fonctionnel</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
                <Text style={styles.legendText}>{stats.acceptableCount} Acceptable</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
                <Text style={styles.legendText}>{stats.nonCompliantCount} Non conforme</Text>
              </View>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const styles = createStyles(theme);

  if (loading || isLoading) {
    return (
      <View style={styles.container}>
        <Header title="Chargement..." />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Chargement des projets...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title="Projets"
        subtitle="Gestion des projets de désenfumage"
        rightComponent={
          <View style={styles.headerActions}>
            {projects.length > 0 && (
              <TouchableOpacity onPress={handleSelectionMode} style={styles.selectionButton}>
                <Text style={styles.selectionButtonText}>
                  {selectionMode ? 'Annuler' : 'Sélect.'}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={handleCreateModal} style={styles.actionButton}>
              <Plus size={24} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
        }
      />

      {selectionMode && (
        <View style={styles.selectionToolbar}>
          <Text style={styles.selectionCount}>
            {selectedProjects.size} sélectionné{selectedProjects.size > 1 ? 's' : ''}
          </Text>
          <View style={styles.selectionActions}>
            <TouchableOpacity 
              style={styles.toolbarButton}
              onPress={handleBulkFavorite}
              disabled={selectedProjects.size === 0}
            >
              <Star size={20} color={selectedProjects.size > 0 ? "#F59E0B" : theme.colors.textTertiary} />
              <Text style={[styles.toolbarButtonText, { color: selectedProjects.size > 0 ? "#F59E0B" : theme.colors.textTertiary }]}>
                Favoris
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.toolbarButton}
              onPress={handleBulkDelete}
              disabled={selectedProjects.size === 0}
            >
              <Trash2 size={20} color={selectedProjects.size > 0 ? theme.colors.error : theme.colors.textTertiary} />
              <Text style={[styles.toolbarButtonText, { color: selectedProjects.size > 0 ? theme.colors.error : theme.colors.textTertiary }]}>
                Supprimer
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Encart d'information sur le taux de conformité */}
      <View style={styles.complianceInfoCard}>
        <Text style={styles.complianceInfoTitle}>⚠️ À propos du taux de conformité</Text>
        <Text style={styles.complianceInfoText}>
          Le taux de conformité affiché n'a aucune valeur réglementaire. Il s'agit simplement d'un indicateur visuel pour aider à suivre globalement les volets d'un projet.
        </Text>
        <Text style={styles.complianceInfoText}>
          Ce taux n'est défini nulle part dans la norme NF S61-933. La norme impose uniquement que chaque volet respecte un écart de ±15% entre le débit mesuré et le débit de référence.
        </Text>
        <View style={styles.complianceColorLegend}>
          <View style={styles.colorLegendItem}>
            <View style={[styles.colorDot, { backgroundColor: '#10B981' }]}/>
            <Text style={styles.colorLegendText}>≥80% : Majorité des volets fonctionnels</Text>
          </View>
          <View style={styles.colorLegendItem}>
            <View style={[styles.colorDot, { backgroundColor: '#F59E0B' }]}/>
            <Text style={styles.colorLegendText}>60-79% : Situation intermédiaire</Text>
          </View>
          <View style={styles.colorLegendItem}>
            <View style={[styles.colorDot, { backgroundColor: '#EF4444' }]}/>
            <Text style={styles.colorLegendText}>{'<'}60% : Attention requise</Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        {projects.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Building size={64} color={theme.colors.textTertiary} />
            <Text style={styles.emptyTitle}>Aucun projet</Text>
            <Text style={styles.emptySubtitle}>
              Créez votre premier projet de désenfumage pour commencer
            </Text>
            <Button
              title="Créer un projet"
              onPress={handleCreateModal}
              style={styles.createButton}
            />
          </View>
        ) : (
          <FlatList
            data={sortedProjects}
            renderItem={renderProject}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center
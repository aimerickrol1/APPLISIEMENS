import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Modal, ScrollView, RefreshControl } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Plus, Settings, Building, Star, Trash2, SquareCheck as CheckSquare, Square, X, TriangleAlert as AlertTriangle } from 'lucide-react-native';
import { Header } from '@/components/Header';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { DateInput } from '@/components/DateInput';
import { Project } from '@/types';
import { useStorage } from '@/contexts/StorageContext';
import { calculateCompliance } from '@/utils/compliance';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';

export default function ProjectsScreen() {
  const { strings } = useLanguage();
  const { theme } = useTheme();
  const { 
    projects, 
    favoriteProjects, 
    createProject, 
    deleteProject, 
    setFavoriteProjects,
    isLoading 
  } = useStorage();
  
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [complianceInfoModalVisible, setComplianceInfoModalVisible] = useState(false);
  
  // Form states
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; startDate?: string; endDate?: string }>({});

  // Convert favoriteProjects array to Set for .has() method
  const favoriteProjectsSet = new Set(favoriteProjects);

  // Écouter l'événement personnalisé pour ouvrir le modal de création
  useEffect(() => {
    const handleOpenCreateModal = () => {
      setCreateModalVisible(true);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('openCreateProjectModal', handleOpenCreateModal);
      
      return () => {
        window.removeEventListener('openCreateProjectModal', handleOpenCreateModal);
      };
    }
  }, []);

  // Recharger les données quand on revient sur cette page
  useFocusEffect(
    useCallback(() => {
      console.log('Projects screen focused, data should be up to date');
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Simuler un délai de rafraîchissement
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const resetForm = () => {
    setName('');
    setCity('');
    setStartDate('');
    setEndDate('');
    setErrors({});
  };

  const handleCreateProject = () => {
    resetForm();
    setCreateModalVisible(true);
  };

  const handleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedProjects(new Set());
  };

  const handleProjectSelection = (projectId: string) => {
    setSelectedProjects(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(projectId)) {
        newSelection.delete(projectId);
      } else {
        newSelection.add(projectId);
      }
      return newSelection;
    });
  };

  const handleBulkDelete = () => {
    if (selectedProjects.size === 0) return;

    Alert.alert(
      strings.delete + ' ' + strings.projects.toLowerCase(),
      `Êtes-vous sûr de vouloir supprimer ${selectedProjects.size} projet${selectedProjects.size > 1 ? 's' : ''} ?`,
      [
        { text: strings.cancel, style: 'cancel' },
        {
          text: strings.delete,
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

    const newFavorites = new Set(favoriteProjectsSet);
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

  const handleToggleFavorite = async (projectId: string) => {
    const newFavorites = new Set(favoriteProjectsSet);
    if (newFavorites.has(projectId)) {
      newFavorites.delete(projectId);
    } else {
      newFavorites.add(projectId);
    }
    
    await setFavoriteProjects(Array.from(newFavorites));
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

  const handleSubmitProject = async () => {
    if (!validateForm()) return;

    setFormLoading(true);
    try {
      console.log('🚀 Création du projet:', name.trim());
      
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

      const project = await createProject(projectData);
      
      if (project) {
        console.log('✅ Projet créé avec succès:', project.id);
        setCreateModalVisible(false);
        resetForm();
        
        // Navigation vers le projet créé
        router.push(`/(tabs)/project/${project.id}`);
      } else {
        console.error('❌ Erreur: Projet non créé');
        Alert.alert(strings.error, 'Impossible de créer le projet.');
      }
    } catch (error) {
      console.error('❌ Erreur lors de la création du projet:', error);
      Alert.alert(strings.error, 'Impossible de créer le projet. Veuillez réessayer.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleProjectPress = (project: Project) => {
    if (selectionMode) {
      handleProjectSelection(project.id);
    } else {
      router.push(`/(tabs)/project/${project.id}`);
    }
  };

  const handleEditProject = (project: Project) => {
    try {
      router.push(`/(tabs)/project/edit/${project.id}`);
    } catch (error) {
      console.error('Erreur de navigation vers édition projet:', error);
    }
  };

  const handleDeleteProject = async (project: Project) => {
    Alert.alert(
      strings.deleteProject,
      `Êtes-vous sûr de vouloir supprimer le projet "${project.name}" ?`,
      [
        { text: strings.cancel, style: 'cancel' },
        {
          text: strings.delete,
          style: 'destructive',
          onPress: async () => {
            console.log('🗑️ Suppression du projet:', project.id);
            const success = await deleteProject(project.id);
            if (success) {
              console.log('✅ Projet supprimé avec succès');
            } else {
              console.error('❌ Erreur lors de la suppression du projet');
            }
          }
        }
      ]
    );
  };

  const getProjectStats = (project: Project) => {
    const buildingCount = project.buildings.length;
    const zoneCount = project.buildings.reduce((total, building) => total + building.functionalZones.length, 0);
    const shutterCount = project.buildings.reduce((total, building) => 
      total + building.functionalZones.reduce((zoneTotal, zone) => zoneTotal + zone.shutters.length, 0), 0);
    
    let compliantCount = 0;
    let acceptableCount = 0;
    let nonCompliantCount = 0;

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
    const aIsFavorite = favoriteProjectsSet.has(a.id);
    const bIsFavorite = favoriteProjectsSet.has(b.id);
    
    if (aIsFavorite && !bIsFavorite) return -1;
    if (!aIsFavorite && bIsFavorite) return 1;
    return 0;
  });

  const renderProject = ({ item }: { item: Project }) => {
    const stats = getProjectStats(item);
    const isSelected = selectedProjects.has(item.id);
    const isFavorite = favoriteProjectsSet.has(item.id);

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
              {item.city && (
                <Text style={styles.projectCity}>{item.city}</Text>
              )}
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

        {(item.startDate || item.endDate) && (
          <View style={styles.dateRange}>
            <Text style={styles.dateText}>
              {item.startDate && new Intl.DateTimeFormat('fr-FR', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              }).format(new Date(item.startDate))}
              {item.startDate && item.endDate && ' → '}
              {item.endDate && new Intl.DateTimeFormat('fr-FR', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              }).format(new Date(item.endDate))}
            </Text>
          </View>
        )}

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Building size={16} color={theme.colors.primary} />
            <Text style={styles.statValue}>{stats.buildingCount}</Text>
            <Text style={styles.statLabel}>{strings.buildings}</Text>
          </View>
          
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: theme.colors.primary + '20' }]}>
              <Text style={[styles.statIconText, { color: theme.colors.primary }]}>Z</Text>
            </View>
            <Text style={styles.statValue}>{stats.zoneCount}</Text>
            <Text style={styles.statLabel}>{strings.zones}</Text>
          </View>

          <View style={styles.statItem}>
            <View style={[styles.complianceIndicator, { 
              backgroundColor: stats.complianceRate >= 80 ? '#10B981' : stats.complianceRate >= 60 ? '#F59E0B' : '#EF4444' 
            }]} />
            <Text style={[styles.statValue, { 
              color: stats.complianceRate >= 80 ? '#10B981' : stats.complianceRate >= 60 ? '#F59E0B' : '#EF4444' 
            }]}>
              {stats.complianceRate.toFixed(0)}%
            </Text>
            <Text style={styles.statLabel}>Conformité</Text>
          </View>
        </View>

        <View style={styles.shutterSummary}>
          <Text style={styles.shutterTotal}>
            {stats.shutterCount} {strings.shutters.toLowerCase()}
          </Text>
          
          {stats.shutterCount > 0 && (
            <View style={styles.complianceBreakdown}>
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
              
              <View style={styles.complianceLabels}>
                <Text style={styles.complianceLabel}>
                  <Text style={[styles.complianceDot, { color: '#10B981' }]}>●</Text> {stats.compliantCount} Fonctionnel
                </Text>
                <Text style={styles.complianceLabel}>
                  <Text style={[styles.complianceDot, { color: '#F59E0B' }]}>●</Text> {stats.acceptableCount} Acceptable
                </Text>
                <Text style={styles.complianceLabel}>
                  <Text style={[styles.complianceDot, { color: '#EF4444' }]}>●</Text> {stats.nonCompliantCount} Non conforme
                </Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.projectFooter}>
          <Text style={styles.createdDate}>
            Créé le {new Intl.DateTimeFormat('fr-FR').format(new Date(item.createdAt))}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const styles = createStyles(theme);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Header title={strings.projectsTitle} subtitle={strings.projectsSubtitle} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{strings.loading}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title={strings.projectsTitle}
        subtitle={strings.projectsSubtitle}
        rightComponent={
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={handleSelectionMode} style={styles.selectionButton}>
              <Text style={styles.selectionButtonText}>
                {selectionMode ? strings.cancel : 'Sélect.'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleCreateProject} style={styles.actionButton}>
              <Plus size={24} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
        }
      />

      {/* NOUVEAU : Encart d'information sur le taux de conformité */}
      <TouchableOpacity 
        style={styles.complianceInfoCard}
        onPress={() => setComplianceInfoModalVisible(true)}
      >
        <View style={styles.complianceInfoContent}>
          <AlertTriangle size={16} color={theme.colors.warning} />
          <Text style={styles.complianceInfoText}>
            Avertissement important
          </Text>
        </View>
      </TouchableOpacity>

      {selectionMode && (
        <View style={styles.selectionToolbar}>
          <Text style={styles.selectionCount}>
            {selectedProjects.size} {strings.selected}{selectedProjects.size > 1 ? 's' : ''}
          </Text>
          <View style={styles.selectionActions}>
            <TouchableOpacity 
              style={styles.toolbarButton}
              onPress={handleBulkFavorite}
              disabled={selectedProjects.size === 0}
            >
              <Star size={20} color={selectedProjects.size > 0 ? "#F59E0B" : theme.colors.textTertiary} />
              <Text style={[styles.toolbarButtonText, { color: selectedProjects.size > 0 ? "#F59E0B" : theme.colors.textTertiary }]}>
                {strings.favorites}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.toolbarButton}
              onPress={handleBulkDelete}
              disabled={selectedProjects.size === 0}
            >
              <Trash2 size={20} color={selectedProjects.size > 0 ? theme.colors.error : theme.colors.textTertiary} />
              <Text style={[styles.toolbarButtonText, { color: selectedProjects.size > 0 ? theme.colors.error : theme.colors.textTertiary }]}>
                {strings.delete}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.content}>
        {projects.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Building size={64} color={theme.colors.textTertiary} />
            <Text style={styles.emptyTitle}>{strings.noProjects}</Text>
            <Text style={styles.emptySubtitle}>
              {strings.noProjectsDesc}
            </Text>
            <Button
              title={strings.createFirstProject}
              onPress={handleCreateProject}
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
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        )}
      </View>

      {/* Modal de création de projet */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={createModalVisible}
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{strings.newProject}</Text>
              <TouchableOpacity 
                onPress={() => setCreateModalVisible(false)}
                style={styles.closeButton}
              >
                <X size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Input
                label={strings.projectName + " *"}
                value={name}
                onChangeText={setName}
                placeholder="Ex: Mesures centre commercial Rivoli"
                error={errors.name}
              />

              <Input
                label={strings.city + " (" + strings.optional + ")"}
                value={city}
                onChangeText={setCity}
                placeholder="Ex: Paris, Lyon, Marseille"
              />

              <DateInput
                label={strings.startDate + " (" + strings.optional + ")"}
                value={startDate}
                onChangeText={setStartDate}
                placeholder="JJ/MM/AAAA"
                error={errors.startDate}
              />

              <DateInput
                label={strings.endDate + " (" + strings.optional + ")"}
                value={endDate}
                onChangeText={setEndDate}
                placeholder="JJ/MM/AAAA"
                error={errors.endDate}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title={strings.cancel}
                onPress={() => setCreateModalVisible(false)}
                variant="secondary"
                style={styles.modalButton}
              />
              <Button
                title={formLoading ? "Création..." : strings.create}
                onPress={handleSubmitProject}
                disabled={formLoading}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* NOUVEAU : Modal d'information sur le taux de conformité */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={complianceInfoModalVisible}
        onRequestClose={() => setComplianceInfoModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.complianceModalContent}>
            <View style={styles.modalHeader}>
              <AlertTriangle size={32} color={theme.colors.warning} />
              <Text style={styles.modalTitle}>Avertissement important</Text>
              <TouchableOpacity 
                onPress={() => setComplianceInfoModalVisible(false)}
                style={styles.closeButton}
              >
                <X size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalText}>
                <Text style={styles.modalBold}>Le taux de conformité affiché dans l'aperçu des projets n'a aucune valeur réglementaire.</Text>
                {'\n\n'}
                Il s'agit uniquement d\'un indicateur visuel pour aider à suivre globalement l'état des volets d\'un projet.
                {'\n\n'}
                Ce taux n'est défini nulle part dans la norme NF S61-933.
                {'\n\n'}
                <Text style={styles.modalBold}>Logique de calcul utilisée :</Text>
                {'\n'}
                • <Text style={{ color: '#10B981', fontFamily: 'Inter-SemiBold' }}>Vert (≥80%)</Text> : Majorité des volets fonctionnels
                {'\n'}
                • <Text style={{ color: '#F59E0B', fontFamily: 'Inter-SemiBold' }}>Orange (60-79%)</Text> : Situation intermédiaire
                {'\n'}
                • <Text style={{ color: '#EF4444', fontFamily: 'Inter-SemiBold' }}>Rouge ({'<'}60%)</Text> : Attention requise
                {'\n\n'}
                <Text style={styles.modalBold}>Rappel des critères réglementaires :</Text>
                {'\n'}
                • Fonctionnel : |Écart| ≤ 10%
                {'\n'}
                • Acceptable : 10% {'<'} |Écart| ≤ 20%
                {'\n'}
                • Non conforme : |Écart| {'>'} 20%
              </Text>
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <Button
                title="Compris"
                onPress={() => setComplianceInfoModalVisible(false)}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectionButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: theme.colors.surfaceSecondary,
  },
  selectionButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: theme.colors.textSecondary,
  },
  actionButton: {
    padding: 8,
  },
  // NOUVEAU : Styles pour l'encart d'information sur le taux de conformité
  complianceInfoCard: {
    backgroundColor: theme.colors.warning + '20',
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.warning,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    padding: 12,
  },
  complianceInfoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  complianceInfoText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.warning,
    flex: 1,
  },
  selectionToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  selectionCount: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: theme.colors.text,
  },
  selectionActions: {
    flexDirection: 'row',
    gap: 16,
  },
  toolbarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceSecondary,
  },
  toolbarButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: theme.colors.text,
    marginTop: 24,
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  createButton: {
    paddingHorizontal: 32,
  },
  listContainer: {
    padding: 16,
  },
  projectCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '20',
  },
  favoriteCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  projectTitleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  checkbox: {
    padding: 2,
  },
  projectInfo: {
    flex: 1,
  },
  projectName: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  projectCity: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: theme.colors.primary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  dateRange: {
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: theme.colors.textSecondary,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: 8,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  statIconText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
  },
  statValue: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: theme.colors.text,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  complianceIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 4,
  },
  shutterSummary: {
    marginBottom: 12,
  },
  shutterTotal: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  complianceBreakdown: {
    gap: 8,
  },
  complianceBar: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: theme.colors.border,
  },
  complianceSegment: {
    height: '100%',
  },
  complianceLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 4,
  },
  complianceLabel: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
  },
  complianceDot: {
    fontSize: 12,
  },
  projectFooter: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.separator,
    paddingTop: 12,
  },
  createdDate: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textTertiary,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  // NOUVEAU : Modal spécifique pour l'information sur le taux de conformité
  complianceModalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.separator,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: theme.colors.text,
    flex: 1,
    marginLeft: 12,
  },
  closeButton: {
    padding: 8,
  },
  modalBody: {
    padding: 20,
    maxHeight: 400,
  },
  modalScrollView: {
    maxHeight: 400,
    marginBottom: 16,
  },
  modalText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  modalBold: {
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: theme.colors.separator,
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
});
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Modal, ScrollView, TextInput } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Plus, Building, Settings, Star, Trash2, SquareCheck as CheckSquare, Square, X, Minus } from 'lucide-react-native';
import { Header } from '@/components/Header';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { DateInput } from '@/components/DateInput';
import { Project } from '@/types';
import { storage } from '@/utils/storage';
import { useLanguage } from '@/contexts/LanguageContext';

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
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [favoriteProjects, setFavoriteProjects] = useState<Set<string>>(new Set());
  
  // États pour le mode sélection
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());

  // États pour le modal de création
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

  const loadProjects = useCallback(async () => {
    try {
      await storage.initialize();
      const projectList = await storage.getProjects();
      setProjects(projectList);
    } catch (error) {
      console.error('Erreur lors du chargement des projets:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFavorites = useCallback(async () => {
    try {
      const favorites = await storage.getFavoriteProjects();
      setFavoriteProjects(new Set(favorites));
    } catch (error) {
      console.error('Erreur lors du chargement des favoris:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProjects();
      loadFavorites();
    }, [loadProjects, loadFavorites])
  );

  useEffect(() => {
    loadProjects();
    loadFavorites();
  }, [loadProjects, loadFavorites]);

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

  // Validation du formulaire
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
      const project = await storage.createProject(projectData);

      // Si la prédéfinition est activée, créer la structure
      if (predefinedStructure.enabled && predefinedStructure.buildings.length > 0) {
        for (const buildingData of predefinedStructure.buildings) {
          if (buildingData.name.trim()) {
            const building = await storage.createBuilding(project.id, {
              name: buildingData.name.trim()
            });

            if (building && buildingData.zones.length > 0) {
              for (const zoneData of buildingData.zones) {
                if (zoneData.name.trim()) {
                  const zone = await storage.createFunctionalZone(building.id, {
                    name: zoneData.name.trim()
                  });

                  if (zone) {
                    // Créer les volets hauts (VH)
                    for (let i = 1; i <= zoneData.highShutters; i++) {
                      await storage.createShutter(zone.id, {
                        name: `VH${i.toString().padStart(2, '0')}`,
                        type: 'high',
                        referenceFlow: 0,
                        measuredFlow: 0
                      });
                    }

                    // Créer les volets bas (VB)
                    for (let i = 1; i <= zoneData.lowShutters; i++) {
                      await storage.createShutter(zone.id, {
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
      loadProjects();

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
    
    setFavoriteProjects(newFavorites);
    await storage.setFavoriteProjects(Array.from(newFavorites));
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
              await storage.deleteProject(projectId);
            }
            setSelectedProjects(new Set());
            setSelectionMode(false);
            loadProjects();
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
    
    setFavoriteProjects(newFavorites);
    await storage.setFavoriteProjects(Array.from(newFavorites));
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
            await storage.deleteProject(project.id);
            loadProjects();
          }
        }
      ]
    );
  };

  const handleEditProject = (project: Project) => {
    router.push(`/(tabs)/project/edit/${project.id}`);
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
    const buildingCount = item.buildings.length;
    const zoneCount = item.buildings.reduce((total, building) => total + building.functionalZones.length, 0);
    const shutterCount = item.buildings.reduce((total, building) => 
      total + building.functionalZones.reduce((zoneTotal, zone) => zoneTotal + zone.shutters.length, 0), 0);

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
                  <CheckSquare size={20} color="#009999" />
                ) : (
                  <Square size={20} color="#9CA3AF" />
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
                  color={isFavorite ? "#F59E0B" : "#9CA3AF"} 
                  fill={isFavorite ? "#F59E0B" : "none"}
                />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => handleEditProject(item)}
              >
                <Settings size={16} color="#009999" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => handleDeleteProject(item)}
              >
                <Trash2 size={16} color="#EF4444" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.projectStats}>
          <View style={styles.statItem}>
            <Building size={14} color="#009999" />
            <Text style={styles.statText}>{buildingCount} bâtiment{buildingCount > 1 ? 's' : ''}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statText}>{zoneCount} zone{zoneCount > 1 ? 's' : ''}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statText}>{shutterCount} volet{shutterCount > 1 ? 's' : ''}</Text>
          </View>
        </View>

        {(item.startDate || item.endDate) && (
          <View style={styles.projectDates}>
            {item.startDate && (
              <Text style={styles.dateText}>
                Début: {new Date(item.startDate).toLocaleDateString('fr-FR')}
              </Text>
            )}
            {item.endDate && (
              <Text style={styles.dateText}>
                Fin: {new Date(item.endDate).toLocaleDateString('fr-FR')}
              </Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderPredefinedStructure = () => {
    if (!predefinedStructure.enabled) return null;

    return (
      <View style={styles.predefinedSection}>
        <Text style={styles.predefinedTitle}>🏗️ Structure prédéfinie</Text>
        
        <ScrollView style={styles.predefinedScroll} nestedScrollEnabled>
          {predefinedStructure.buildings.map((building) => (
            <View key={building.id} style={styles.buildingContainer}>
              <View style={styles.buildingHeader}>
                <TextInput
                  style={styles.buildingNameInput}
                  value={building.name}
                  onChangeText={(text) => updateBuildingName(building.id, text)}
                  placeholder="Nom du bâtiment"
                />
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeBuilding(building.id)}
                >
                  <X size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.addZoneButton}
                onPress={() => addZone(building.id)}
              >
                <Plus size={16} color="#009999" />
                <Text style={styles.addZoneText}>Ajouter une zone</Text>
              </TouchableOpacity>

              {building.zones.map((zone) => (
                <View key={zone.id} style={styles.zoneContainer}>
                  <View style={styles.zoneHeader}>
                    <TextInput
                      style={styles.zoneNameInput}
                      value={zone.name}
                      onChangeText={(text) => updateZoneName(building.id, zone.id, text)}
                      placeholder="Nom de la zone"
                    />
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeZone(building.id, zone.id)}
                    >
                      <X size={14} color="#EF4444" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.shutterControls}>
                    <View style={styles.shutterControl}>
                      <Text style={styles.shutterLabel}>VH (Hauts)</Text>
                      <View style={styles.counterContainer}>
                        <TouchableOpacity
                          style={styles.counterButton}
                          onPress={() => updateShutterCount(building.id, zone.id, 'high', zone.highShutters - 1)}
                        >
                          <Minus size={14} color="#009999" />
                        </TouchableOpacity>
                        <Text style={styles.counterValue}>{zone.highShutters}</Text>
                        <TouchableOpacity
                          style={styles.counterButton}
                          onPress={() => updateShutterCount(building.id, zone.id, 'high', zone.highShutters + 1)}
                        >
                          <Plus size={14} color="#009999" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.shutterControl}>
                      <Text style={styles.shutterLabel}>VB (Bas)</Text>
                      <View style={styles.counterContainer}>
                        <TouchableOpacity
                          style={styles.counterButton}
                          onPress={() => updateShutterCount(building.id, zone.id, 'low', zone.lowShutters - 1)}
                        >
                          <Minus size={14} color="#009999" />
                        </TouchableOpacity>
                        <Text style={styles.counterValue}>{zone.lowShutters}</Text>
                        <TouchableOpacity
                          style={styles.counterButton}
                          onPress={() => updateShutterCount(building.id, zone.id, 'low', zone.lowShutters + 1)}
                        >
                          <Plus size={14} color="#009999" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ))}

          <TouchableOpacity style={styles.addBuildingButton} onPress={addBuilding}>
            <Plus size={20} color="#009999" />
            <Text style={styles.addBuildingText}>Ajouter un bâtiment</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  };

  if (loading) {
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
              <Plus size={24} color="#009999" />
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
              <Star size={20} color={selectedProjects.size > 0 ? "#F59E0B" : "#9CA3AF"} />
              <Text style={[styles.toolbarButtonText, { color: selectedProjects.size > 0 ? "#F59E0B" : "#9CA3AF" }]}>
                Favoris
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.toolbarButton}
              onPress={handleBulkDelete}
              disabled={selectedProjects.size === 0}
            >
              <Trash2 size={20} color={selectedProjects.size > 0 ? "#EF4444" : "#9CA3AF"} />
              <Text style={[styles.toolbarButtonText, { color: selectedProjects.size > 0 ? "#EF4444" : "#9CA3AF" }]}>
                Supprimer
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.content}>
        {projects.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Building size={64} color="#D1D5DB" />
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

      {/* Modal de création de projet avec prédéfinition */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={createModalVisible}
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nouveau projet</Text>
              <TouchableOpacity 
                onPress={() => setCreateModalVisible(false)}
                style={styles.closeButton}
              >
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
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

              {/* Section prédéfinition de structure */}
              <View style={styles.predefinedToggleSection}>
                <View style={styles.toggleHeader}>
                  <Text style={styles.toggleTitle}>🏗️ Prédéfinir la structure (optionnel)</Text>
                  <TouchableOpacity
                    style={[styles.toggle, predefinedStructure.enabled && styles.toggleActive]}
                    onPress={togglePredefinedStructure}
                  >
                    <View style={[styles.toggleThumb, predefinedStructure.enabled && styles.toggleThumbActive]} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.toggleDescription}>
                  Créez automatiquement vos bâtiments, zones et volets
                </Text>
              </View>

              {renderPredefinedStructure()}
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title="Annuler"
                onPress={() => setCreateModalVisible(false)}
                variant="secondary"
                style={styles.modalButton}
              />
              <Button
                title="Créer le projet"
                onPress={handleCreateProject}
                disabled={formLoading}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
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
    backgroundColor: '#F3F4F6',
  },
  selectionButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#374151',
  },
  actionButton: {
    padding: 8,
  },
  selectionToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  selectionCount: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#111827',
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
    backgroundColor: '#F9FAFB',
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
    color: '#111827',
    marginTop: 24,
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
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
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: '#009999',
    backgroundColor: '#F0FDFA',
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
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 2,
  },
  projectCity: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#009999',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  projectStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  projectDates: {
    flexDirection: 'row',
    gap: 16,
  },
  dateText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },

  // Styles pour le modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#111827',
  },
  closeButton: {
    padding: 8,
  },
  modalBody: {
    padding: 20,
    maxHeight: 400,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },

  // Styles pour la prédéfinition de structure
  predefinedToggleSection: {
    marginBottom: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  toggleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  toggleTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: '#009999',
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbActive: {
    transform: [{ translateX: 22 }],
  },
  toggleDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  predefinedSection: {
    marginTop: 16,
  },
  predefinedTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 16,
  },
  predefinedScroll: {
    maxHeight: 300,
  },
  buildingContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  buildingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  buildingNameInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    backgroundColor: '#ffffff',
    marginRight: 8,
  },
  removeButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#FEF2F2',
  },
  addZoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: 12,
  },
  addZoneText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#009999',
    marginLeft: 6,
  },
  zoneContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  zoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  zoneNameInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    backgroundColor: '#F9FAFB',
    marginRight: 8,
  },
  shutterControls: {
    flexDirection: 'row',
    gap: 16,
  },
  shutterControl: {
    flex: 1,
  },
  shutterLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#374151',
    marginBottom: 6,
    textAlign: 'center',
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 4,
  },
  counterButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  counterValue: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginHorizontal: 16,
    minWidth: 24,
    textAlign: 'center',
  },
  addBuildingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#F0FDFA',
    borderWidth: 2,
    borderColor: '#009999',
    borderStyle: 'dashed',
    marginTop: 8,
  },
  addBuildingText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#009999',
    marginLeft: 8,
  },
});
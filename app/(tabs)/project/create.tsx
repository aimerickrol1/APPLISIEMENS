import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { ChevronDown, ChevronRight, Building, Wind, Plus, Minus } from 'lucide-react-native';
import { Header } from '@/components/Header';
import { Input } from '@/components/Input';
import { DateInput } from '@/components/DateInput';
import { Button } from '@/components/Button';
import { NumericInput } from '@/components/NumericInput';
import { storage } from '@/utils/storage';
import { useLanguage } from '@/contexts/LanguageContext';

// Interface pour la configuration d'un bâtiment
interface BuildingConfig {
  id: string;
  name: string;
  zones: ZoneConfig[];
}

// Interface pour la configuration d'une zone
interface ZoneConfig {
  id: string;
  name: string;
  highShutters: number;
  lowShutters: number;
}

export default function CreateProjectScreen() {
  const { strings, currentLanguage } = useLanguage();
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; startDate?: string; endDate?: string }>({});

  // États pour la prédéfinition de structure AMÉLIORÉE
  const [enableStructurePreset, setEnableStructurePreset] = useState(false);
  const [buildingCount, setBuildingCount] = useState(1);
  const [buildings, setBuildings] = useState<BuildingConfig[]>([]);
  const [expandedBuildings, setExpandedBuildings] = useState<Set<string>>(new Set());

  // Initialiser les bâtiments quand le nombre change
  React.useEffect(() => {
    if (enableStructurePreset) {
      const newBuildings: BuildingConfig[] = [];
      for (let i = 0; i < buildingCount; i++) {
        const buildingId = `building-${i}`;
        const existingBuilding = buildings.find(b => b.id === buildingId);
        
        if (existingBuilding) {
          newBuildings.push(existingBuilding);
        } else {
          newBuildings.push({
            id: buildingId,
            name: `Bâtiment ${String.fromCharCode(65 + i)}`, // A, B, C, etc.
            zones: [
              {
                id: `zone-${i}-0`,
                name: 'ZF01',
                highShutters: 1,
                lowShutters: 1
              }
            ]
          });
        }
      }
      setBuildings(newBuildings);
    }
  }, [buildingCount, enableStructurePreset]);

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

  // Fonctions pour gérer les bâtiments
  const toggleBuildingExpansion = (buildingId: string) => {
    setExpandedBuildings(prev => {
      const newSet = new Set(prev);
      if (newSet.has(buildingId)) {
        newSet.delete(buildingId);
      } else {
        newSet.add(buildingId);
      }
      return newSet;
    });
  };

  const updateBuildingName = (buildingId: string, newName: string) => {
    setBuildings(prev => prev.map(building => 
      building.id === buildingId 
        ? { ...building, name: newName }
        : building
    ));
  };

  const addZoneToBuilding = (buildingId: string) => {
    setBuildings(prev => prev.map(building => {
      if (building.id === buildingId) {
        const newZoneIndex = building.zones.length;
        const newZone: ZoneConfig = {
          id: `zone-${buildingId}-${newZoneIndex}`,
          name: `ZF${(newZoneIndex + 1).toString().padStart(2, '0')}`,
          highShutters: 1,
          lowShutters: 1
        };
        return {
          ...building,
          zones: [...building.zones, newZone]
        };
      }
      return building;
    }));
  };

  const removeZoneFromBuilding = (buildingId: string, zoneId: string) => {
    setBuildings(prev => prev.map(building => {
      if (building.id === buildingId) {
        return {
          ...building,
          zones: building.zones.filter(zone => zone.id !== zoneId)
        };
      }
      return building;
    }));
  };

  const updateZone = (buildingId: string, zoneId: string, updates: Partial<ZoneConfig>) => {
    setBuildings(prev => prev.map(building => {
      if (building.id === buildingId) {
        return {
          ...building,
          zones: building.zones.map(zone => 
            zone.id === zoneId 
              ? { ...zone, ...updates }
              : zone
          )
        };
      }
      return building;
    }));
  };

  const createStructurePreset = async (projectId: string) => {
    try {
      for (const buildingConfig of buildings) {
        const building = await storage.createBuilding(projectId, {
          name: buildingConfig.name,
          description: `Bâtiment généré automatiquement`
        });

        if (building) {
          for (const zoneConfig of buildingConfig.zones) {
            const zone = await storage.createFunctionalZone(building.id, {
              name: zoneConfig.name,
              description: `Zone générée automatiquement`
            });

            if (zone) {
              // Créer les volets hauts
              for (let vh = 1; vh <= zoneConfig.highShutters; vh++) {
                await storage.createShutter(zone.id, {
                  name: `VH${vh.toString().padStart(2, '0')}`,
                  type: 'high',
                  referenceFlow: 0,
                  measuredFlow: 0
                });
              }

              // Créer les volets bas
              for (let vb = 1; vb <= zoneConfig.lowShutters; vb++) {
                await storage.createShutter(zone.id, {
                  name: `VB${vb.toString().padStart(2, '0')}`,
                  type: 'low',
                  referenceFlow: 0,
                  measuredFlow: 0
                });
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors de la création de la structure prédéfinie:', error);
      throw error;
    }
  };

  const handleCreate = async () => {
    if (!validateForm()) return;

    setLoading(true);
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

      const project = await storage.createProject(projectData);

      // Créer la structure prédéfinie si activée
      if (enableStructurePreset) {
        await createStructurePreset(project.id);
      }

      router.replace(`/(tabs)/project/${project.id}`);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de créer le projet. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  // Calculer les totaux pour l'aperçu
  const getTotals = () => {
    const totalZones = buildings.reduce((sum, building) => sum + building.zones.length, 0);
    const totalShutters = buildings.reduce((sum, building) => 
      sum + building.zones.reduce((zoneSum, zone) => 
        zoneSum + zone.highShutters + zone.lowShutters, 0), 0);
    
    return { totalZones, totalShutters };
  };

  const { totalZones, totalShutters } = getTotals();

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

        {/* Section Prédéfinition de structure AMÉLIORÉE */}
        <View style={styles.structureSection}>
          <TouchableOpacity 
            style={styles.structureHeader}
            onPress={() => setEnableStructurePreset(!enableStructurePreset)}
            activeOpacity={0.7}
          >
            <View style={styles.structureTitle}>
              <Text style={styles.structureIcon}>🏗️</Text>
              <Text style={styles.structureTitleText}>Prédéfinir la structure (optionnel)</Text>
            </View>
            <View style={[styles.toggle, enableStructurePreset && styles.toggleActive]}>
              <View style={[styles.toggleThumb, enableStructurePreset && styles.toggleThumbActive]} />
            </View>
          </TouchableOpacity>
          
          <Text style={styles.structureDescription}>
            Créez automatiquement vos bâtiments, zones et volets avec une configuration personnalisée
          </Text>

          {enableStructurePreset && (
            <View style={styles.structureInputs}>
              {/* Sélection du nombre de bâtiments */}
              <View style={styles.buildingCountSection}>
                <NumericInput
                  label="🏢 Nombre de bâtiments (max 10)"
                  value={buildingCount}
                  onValueChange={setBuildingCount}
                  min={1}
                  max={10}
                />
              </View>

              {/* Configuration détaillée de chaque bâtiment */}
              <View style={styles.buildingsConfigSection}>
                <Text style={styles.buildingsConfigTitle}>📋 Configuration des bâtiments</Text>
                
                {buildings.map((building, buildingIndex) => (
                  <View key={building.id} style={styles.buildingConfigCard}>
                    {/* En-tête du bâtiment */}
                    <TouchableOpacity
                      style={styles.buildingConfigHeader}
                      onPress={() => toggleBuildingExpansion(building.id)}
                    >
                      <View style={styles.buildingConfigHeaderLeft}>
                        <Building size={16} color="#009999" />
                        <Text style={styles.buildingConfigName}>{building.name}</Text>
                        <Text style={styles.buildingConfigSummary}>
                          ({building.zones.length} zone{building.zones.length > 1 ? 's' : ''})
                        </Text>
                      </View>
                      {expandedBuildings.has(building.id) ? (
                        <ChevronDown size={16} color="#6B7280" />
                      ) : (
                        <ChevronRight size={16} color="#6B7280" />
                      )}
                    </TouchableOpacity>

                    {/* Configuration détaillée du bâtiment */}
                    {expandedBuildings.has(building.id) && (
                      <View style={styles.buildingConfigContent}>
                        {/* Nom du bâtiment */}
                        <Input
                          label="Nom du bâtiment"
                          value={building.name}
                          onChangeText={(text) => updateBuildingName(building.id, text)}
                          placeholder="Ex: Bâtiment A, Tour Nord"
                        />

                        {/* Zones du bâtiment */}
                        <View style={styles.zonesSection}>
                          <View style={styles.zonesSectionHeader}>
                            <Text style={styles.zonesSectionTitle}>🏗️ Zones de désenfumage</Text>
                            <TouchableOpacity
                              style={styles.addZoneButton}
                              onPress={() => addZoneToBuilding(building.id)}
                            >
                              <Plus size={14} color="#009999" />
                              <Text style={styles.addZoneButtonText}>Ajouter une zone</Text>
                            </TouchableOpacity>
                          </View>

                          {building.zones.map((zone, zoneIndex) => (
                            <View key={zone.id} style={styles.zoneConfigCard}>
                              <View style={styles.zoneConfigHeader}>
                                <Wind size={14} color="#F59E0B" />
                                <Input
                                  value={zone.name}
                                  onChangeText={(text) => updateZone(building.id, zone.id, { name: text })}
                                  placeholder="Ex: ZF01, Zone Hall"
                                  style={styles.zoneNameInput}
                                />
                                {building.zones.length > 1 && (
                                  <TouchableOpacity
                                    style={styles.removeZoneButton}
                                    onPress={() => removeZoneFromBuilding(building.id, zone.id)}
                                  >
                                    <Minus size={14} color="#EF4444" />
                                  </TouchableOpacity>
                                )}
                              </View>

                              <View style={styles.shuttersConfig}>
                                <View style={styles.shutterTypeConfig}>
                                  <View style={styles.shutterTypeHeader}>
                                    <View style={[styles.shutterDot, { backgroundColor: '#10B981' }]} />
                                    <Text style={styles.shutterTypeLabel}>Volets Hauts (VH)</Text>
                                  </View>
                                  <NumericInput
                                    value={zone.highShutters}
                                    onValueChange={(value) => updateZone(building.id, zone.id, { highShutters: value })}
                                    min={0}
                                    max={30}
                                    style={styles.shutterCountInput}
                                  />
                                </View>

                                <View style={styles.shutterTypeConfig}>
                                  <View style={styles.shutterTypeHeader}>
                                    <View style={[styles.shutterDot, { backgroundColor: '#F59E0B' }]} />
                                    <Text style={styles.shutterTypeLabel}>Volets Bas (VB)</Text>
                                  </View>
                                  <NumericInput
                                    value={zone.lowShutters}
                                    onValueChange={(value) => updateZone(building.id, zone.id, { lowShutters: value })}
                                    min={0}
                                    max={30}
                                    style={styles.shutterCountInput}
                                  />
                                </View>
                              </View>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}
                  </View>
                ))}
              </View>

              {/* Aperçu global de la structure */}
              <View style={styles.globalPreviewContainer}>
                <Text style={styles.globalPreviewTitle}>📊 Aperçu global de la structure</Text>
                <View style={styles.globalPreviewStats}>
                  <View style={styles.globalPreviewStat}>
                    <Text style={styles.globalPreviewStatValue}>{buildings.length}</Text>
                    <Text style={styles.globalPreviewStatLabel}>Bâtiment{buildings.length > 1 ? 's' : ''}</Text>
                  </View>
                  <View style={styles.globalPreviewStat}>
                    <Text style={styles.globalPreviewStatValue}>{totalZones}</Text>
                    <Text style={styles.globalPreviewStatLabel}>Zone{totalZones > 1 ? 's' : ''}</Text>
                  </View>
                  <View style={styles.globalPreviewStat}>
                    <Text style={styles.globalPreviewStatValue}>{totalShutters}</Text>
                    <Text style={styles.globalPreviewStatLabel}>Volet{totalShutters > 1 ? 's' : ''}</Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>

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

  // Styles pour la section de prédéfinition de structure
  structureSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  structureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 4,
  },
  structureTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  structureIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  structureTitleText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  structureDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 16,
  },
  
  // Toggle switch
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#D1D5DB',
    padding: 2,
    justifyContent: 'center',
    position: 'relative',
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
    position: 'absolute',
    left: 2,
  },
  toggleThumbActive: {
    left: 24,
  },

  // Inputs de structure
  structureInputs: {
    gap: 20,
  },

  // Section nombre de bâtiments
  buildingCountSection: {
    marginBottom: 8,
  },

  // Section configuration des bâtiments
  buildingsConfigSection: {
    marginTop: 8,
  },
  buildingsConfigTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
    marginBottom: 16,
  },

  // Carte de configuration d'un bâtiment
  buildingConfigCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  buildingConfigHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F3F4F6',
  },
  buildingConfigHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  buildingConfigName: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  buildingConfigSummary: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  buildingConfigContent: {
    padding: 16,
    gap: 16,
  },

  // Section zones
  zonesSection: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  zonesSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  zonesSectionTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
  },
  addZoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F0FDFA',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  addZoneButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#009999',
  },

  // Carte de configuration d'une zone
  zoneConfigCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  zoneConfigHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  zoneNameInput: {
    flex: 1,
    marginBottom: 0,
  },
  removeZoneButton: {
    padding: 4,
    backgroundColor: '#FEF2F2',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FECACA',
  },

  // Configuration des volets
  shuttersConfig: {
    flexDirection: 'row',
    gap: 12,
  },
  shutterTypeConfig: {
    flex: 1,
  },
  shutterTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  shutterDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  shutterTypeLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#374151',
  },
  shutterCountInput: {
    marginBottom: 0,
  },

  // Aperçu global de la structure
  globalPreviewContainer: {
    backgroundColor: '#F0FDFA',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  globalPreviewTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#047857',
    marginBottom: 16,
    textAlign: 'center',
  },
  globalPreviewStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  globalPreviewStat: {
    alignItems: 'center',
  },
  globalPreviewStatValue: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#059669',
  },
  globalPreviewStatLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#047857',
    marginTop: 4,
    textAlign: 'center',
  },
});
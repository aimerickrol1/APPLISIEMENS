import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useStorage } from '@/contexts/StorageContext';
import { Building, Zone } from '@/types';
import { Trash2, CreditCard as Edit, Plus, Star } from 'lucide-react-native';

export default function BuildingDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { projects, zones, deleteBuilding, favoriteZones, toggleFavoriteZone } = useStorage();
  const [building, setBuilding] = useState<Building | null>(null);
  const [activeTab, setActiveTab] = useState<'smoke' | 'compartment'>('smoke');
  const [projectMode, setProjectMode] = useState<'simple' | 'complete'>('simple');

  useEffect(() => {
    let foundBuilding: Building | null = null;
    
    // Search through all projects to find the building with the matching ID
    for (const project of projects) {
      if (project.buildings) {
        const building = project.buildings.find(b => b.id === id);
        if (building) {
          foundBuilding = building;
          break;
        }
      }
    }
    
    if (foundBuilding) {
      setBuilding(foundBuilding);
    }
  }, [id, projects]);

  const favoriteZonesSet = new Set(favoriteZones);

  const getZonesToDisplay = () => {
    if (!building) return [];
    
    if (projectMode === 'simple') {
      return building.compartmentZones || []; // Zones de compartimentage uniquement
    } else if (projectMode === 'complete') {
      // En mode complet, afficher selon l'onglet actif
      if (activeTab === 'smoke') {
        return building.functionalZones;
      } else {
        return building.compartmentZones || [];
      }
    }
    
    return building.functionalZones; // Par défaut
  };

  // Trier les zones : favoris en premier
  const zonesToDisplay = getZonesToDisplay();
  const sortedZones = zonesToDisplay.sort((a, b) => {
    const aIsFavorite = favoriteZonesSet.has(a.id);
    const bIsFavorite = favoriteZonesSet.has(b.id);
    
    if (aIsFavorite && !bIsFavorite) return -1;
    if (!aIsFavorite && bIsFavorite) return 1;
    return 0;
  });

  const handleDelete = () => {
    Alert.alert(
      'Supprimer le bâtiment',
      'Êtes-vous sûr de vouloir supprimer ce bâtiment ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            if (building) {
              deleteBuilding(building.id);
              router.back();
            }
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    router.push(`/(tabs)/building/edit/${id}`);
  };

  const handleAddZone = () => {
    router.push({
      pathname: '/(tabs)/zone/create',
      params: { buildingId: id }
    });
  };

  const handleZonePress = (zoneId: string) => {
    router.push(`/(tabs)/zone/${zoneId}`);
  };

  const handleToggleFavorite = (zoneId: string) => {
    toggleFavoriteZone(zoneId);
  };

  if (!building) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Bâtiment non trouvé</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{building.name}</Text>
          <Text style={styles.subtitle}>{building.address}</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleEdit}>
            <Edit size={20} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
            <Trash2 size={20} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Informations</Text>
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Surface</Text>
            <Text style={styles.infoValue}>{building.area} m²</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Hauteur</Text>
            <Text style={styles.infoValue}>{building.height} m</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Type</Text>
            <Text style={styles.infoValue}>{building.type}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Année</Text>
            <Text style={styles.infoValue}>{building.constructionYear}</Text>
          </View>
        </View>
      </View>

      <View style={styles.zonesSection}>
        <View style={styles.zonesSectionHeader}>
          <Text style={styles.sectionTitle}>Zones</Text>
          <TouchableOpacity style={styles.addButton} onPress={handleAddZone}>
            <Plus size={20} color="#007AFF" />
            <Text style={styles.addButtonText}>Ajouter</Text>
          </TouchableOpacity>
        </View>

        {projectMode === 'complete' && (
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'smoke' && styles.activeTab]}
              onPress={() => setActiveTab('smoke')}
            >
              <Text style={[styles.tabText, activeTab === 'smoke' && styles.activeTabText]}>
                Zones fonctionnelles
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'compartment' && styles.activeTab]}
              onPress={() => setActiveTab('compartment')}
            >
              <Text style={[styles.tabText, activeTab === 'compartment' && styles.activeTabText]}>
                Zones de compartimentage
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {sortedZones.length > 0 ? (
          sortedZones.map((zone) => (
            <TouchableOpacity
              key={zone.id}
              style={styles.zoneCard}
              onPress={() => handleZonePress(zone.id)}
            >
              <View style={styles.zoneInfo}>
                <Text style={styles.zoneName}>{zone.name}</Text>
                <Text style={styles.zoneType}>{zone.type}</Text>
                <Text style={styles.zoneArea}>{zone.area} m²</Text>
              </View>
              <TouchableOpacity
                style={styles.favoriteButton}
                onPress={() => handleToggleFavorite(zone.id)}
              >
                <Star
                  size={20}
                  color={favoriteZonesSet.has(zone.id) ? "#FFD700" : "#C7C7CC"}
                  fill={favoriteZonesSet.has(zone.id) ? "#FFD700" : "none"}
                />
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Aucune zone définie</Text>
            <Text style={styles.emptyStateSubtext}>
              Ajoutez des zones pour commencer l'analyse
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 8,
  },
  infoSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  infoItem: {
    flex: 1,
    minWidth: '45%',
  },
  infoLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  zonesSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    padding: 16,
  },
  zonesSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 2,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
  },
  tabText: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#000000',
  },
  zoneCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: 8,
  },
  zoneInfo: {
    flex: 1,
  },
  zoneName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 4,
  },
  zoneType: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 2,
  },
  zoneArea: {
    fontSize: 14,
    color: '#8E8E93',
  },
  favoriteButton: {
    padding: 4,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#8E8E93',
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#C7C7CC',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginTop: 50,
  },
});
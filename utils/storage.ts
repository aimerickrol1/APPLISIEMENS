import { Project, Building, FunctionalZone, Shutter, SearchResult } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Clés de stockage
const PROJECTS_KEY = 'SIEMENS_PROJECTS_STORAGE';
const FAVORITE_PROJECTS_KEY = 'SIEMENS_FAVORITE_PROJECTS';
const FAVORITE_BUILDINGS_KEY = 'SIEMENS_FAVORITE_BUILDINGS';
const FAVORITE_ZONES_KEY = 'SIEMENS_FAVORITE_ZONES';
const FAVORITE_SHUTTERS_KEY = 'SIEMENS_FAVORITE_SHUTTERS';
const QUICK_CALC_HISTORY_KEY = 'SIEMENS_QUICK_CALC_HISTORY';

// Interface pour l'historique des calculs rapides
export interface QuickCalcHistoryItem {
  id: string;
  referenceFlow: number;
  measuredFlow: number;
  deviation: number;
  status: 'compliant' | 'acceptable' | 'non-compliant';
  color: string;
  timestamp: Date;
}

// Cache en mémoire pour les performances
let projects: Project[] = [];
let favoriteProjects: string[] = [];
let favoriteBuildings: string[] = [];
let favoriteZones: string[] = [];
let favoriteShutters: string[] = [];
let quickCalcHistory: QuickCalcHistoryItem[] = [];

// Variables pour éviter les chargements multiples
let isInitialized = false;

// Fonction utilitaire pour sauvegarder les projets avec gestion d'erreur
async function saveProjects(): Promise<void> {
  try {
    await AsyncStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des projets:', error);
  }
}

// Fonction utilitaire pour charger les projets avec gestion d'erreur robuste
async function loadProjectsFromStorage(): Promise<void> {
  try {
    const data = await AsyncStorage.getItem(PROJECTS_KEY);
    
    if (data) {
      const parsedProjects = JSON.parse(data);
      
      // Convertir les dates string en objets Date avec validation
      projects = parsedProjects.map((project: any) => ({
        ...project,
        createdAt: project.createdAt ? new Date(project.createdAt) : new Date(),
        updatedAt: project.updatedAt ? new Date(project.updatedAt) : new Date(),
        startDate: project.startDate ? new Date(project.startDate) : undefined,
        endDate: project.endDate ? new Date(project.endDate) : undefined,
        buildings: (project.buildings || []).map((building: any) => ({
          ...building,
          createdAt: building.createdAt ? new Date(building.createdAt) : new Date(),
          functionalZones: (building.functionalZones || []).map((zone: any) => ({
            ...zone,
            createdAt: zone.createdAt ? new Date(zone.createdAt) : new Date(),
            shutters: (zone.shutters || []).map((shutter: any) => ({
              ...shutter,
              createdAt: shutter.createdAt ? new Date(shutter.createdAt) : new Date(),
              updatedAt: shutter.updatedAt ? new Date(shutter.updatedAt) : new Date()
            }))
          }))
        }))
      }));
    } else {
      projects = [];
    }
  } catch (error) {
    console.error('Erreur lors du chargement des projets:', error);
    projects = [];
  }
}

// Fonction pour générer un ID unique plus robuste
function generateUniqueId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export const storage = {
  // Initialisation simplifiée
  async initialize(): Promise<void> {
    if (isInitialized) {
      return;
    }
    
    try {
      await loadProjectsFromStorage();
      isInitialized = true;
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du stockage:', error);
      isInitialized = true;
    }
  },

  // Projects
  async getProjects(): Promise<Project[]> {
    try {
      if (!isInitialized) {
        await this.initialize();
      }
      return [...projects];
    } catch (error) {
      console.error('Erreur dans getProjects:', error);
      return [];
    }
  },

  async createProject(projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'buildings'>): Promise<Project> {
    try {
      if (!isInitialized) {
        await this.initialize();
      }
      
      const project: Project = {
        ...projectData,
        id: generateUniqueId(),
        createdAt: new Date(),
        updatedAt: new Date(),
        buildings: []
      };
      
      projects.push(project);
      await saveProjects();
      return project;
    } catch (error) {
      console.error('Erreur lors de la création du projet:', error);
      throw error;
    }
  },

  async updateProject(id: string, updates: Partial<Project>): Promise<Project | null> {
    try {
      if (!isInitialized) {
        await this.initialize();
      }
      
      const index = projects.findIndex(p => p.id === id);
      if (index === -1) return null;
      
      projects[index] = { ...projects[index], ...updates, updatedAt: new Date() };
      await saveProjects();
      return projects[index];
    } catch (error) {
      console.error('Erreur lors de la mise à jour du projet:', error);
      return null;
    }
  },

  async deleteProject(id: string): Promise<boolean> {
    try {
      if (!isInitialized) {
        await this.initialize();
      }
      
      const index = projects.findIndex(p => p.id === id);
      if (index === -1) return false;
      
      projects.splice(index, 1);
      favoriteProjects = favoriteProjects.filter(fId => fId !== id);
      
      await saveProjects();
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression du projet:', error);
      return false;
    }
  },

  // Favorites - Projects
  async getFavoriteProjects(): Promise<string[]> {
    try {
      const data = await AsyncStorage.getItem(FAVORITE_PROJECTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      return [];
    }
  },

  async setFavoriteProjects(favorites: string[]): Promise<void> {
    try {
      favoriteProjects = [...favorites];
      await AsyncStorage.setItem(FAVORITE_PROJECTS_KEY, JSON.stringify(favoriteProjects));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des favoris projets:', error);
    }
  },

  // Favorites - Buildings
  async getFavoriteBuildings(): Promise<string[]> {
    try {
      const data = await AsyncStorage.getItem(FAVORITE_BUILDINGS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      return [];
    }
  },

  async setFavoriteBuildings(favorites: string[]): Promise<void> {
    try {
      favoriteBuildings = [...favorites];
      await AsyncStorage.setItem(FAVORITE_BUILDINGS_KEY, JSON.stringify(favoriteBuildings));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des favoris bâtiments:', error);
    }
  },

  // Favorites - Zones
  async getFavoriteZones(): Promise<string[]> {
    try {
      const data = await AsyncStorage.getItem(FAVORITE_ZONES_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      return [];
    }
  },

  async setFavoriteZones(favorites: string[]): Promise<void> {
    try {
      favoriteZones = [...favorites];
      await AsyncStorage.setItem(FAVORITE_ZONES_KEY, JSON.stringify(favoriteZones));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des favoris zones:', error);
    }
  },

  // Favorites - Shutters
  async getFavoriteShutters(): Promise<string[]> {
    try {
      const data = await AsyncStorage.getItem(FAVORITE_SHUTTERS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      return [];
    }
  },

  async setFavoriteShutters(favorites: string[]): Promise<void> {
    try {
      favoriteShutters = [...favorites];
      await AsyncStorage.setItem(FAVORITE_SHUTTERS_KEY, JSON.stringify(favoriteShutters));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des favoris volets:', error);
    }
  },

  // Gestion de l'historique des calculs rapides
  async getQuickCalcHistory(): Promise<QuickCalcHistoryItem[]> {
    try {
      const data = await AsyncStorage.getItem(QUICK_CALC_HISTORY_KEY);
      if (data) {
        const parsedHistory = JSON.parse(data);
        return parsedHistory.map((item: any) => ({
          ...item,
          timestamp: item.timestamp ? new Date(item.timestamp) : new Date()
        }));
      }
      return [];
    } catch (error) {
      return [];
    }
  },

  async addQuickCalcHistory(item: Omit<QuickCalcHistoryItem, 'id' | 'timestamp'>): Promise<void> {
    try {
      const history = await this.getQuickCalcHistory();
      
      const newItem: QuickCalcHistoryItem = {
        ...item,
        id: generateUniqueId(),
        timestamp: new Date()
      };
      
      history.unshift(newItem);
      const limitedHistory = history.slice(0, 5);
      
      await AsyncStorage.setItem(QUICK_CALC_HISTORY_KEY, JSON.stringify(limitedHistory));
    } catch (error) {
      console.error('Erreur lors de l\'ajout à l\'historique:', error);
    }
  },

  async clearQuickCalcHistory(): Promise<void> {
    try {
      await AsyncStorage.setItem(QUICK_CALC_HISTORY_KEY, JSON.stringify([]));
    } catch (error) {
      console.error('Erreur lors de l\'effacement de l\'historique:', error);
    }
  },

  // Buildings
  async createBuilding(projectId: string, buildingData: Omit<Building, 'id' | 'projectId' | 'createdAt' | 'functionalZones'>): Promise<Building | null> {
    try {
      if (!isInitialized) {
        await this.initialize();
      }
      
      const project = projects.find(p => p.id === projectId);
      if (!project) return null;

      const building: Building = {
        ...buildingData,
        id: generateUniqueId(),
        projectId,
        createdAt: new Date(),
        functionalZones: []
      };

      project.buildings.push(building);
      await saveProjects();
      return building;
    } catch (error) {
      console.error('Erreur lors de la création du bâtiment:', error);
      return null;
    }
  },

  async updateBuilding(buildingId: string, updates: Partial<Building>): Promise<Building | null> {
    try {
      if (!isInitialized) {
        await this.initialize();
      }
      
      for (const project of projects) {
        const buildingIndex = project.buildings.findIndex(b => b.id === buildingId);
        if (buildingIndex !== -1) {
          project.buildings[buildingIndex] = { ...project.buildings[buildingIndex], ...updates };
          await saveProjects();
          return project.buildings[buildingIndex];
        }
      }
      return null;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du bâtiment:', error);
      return null;
    }
  },

  async deleteBuilding(buildingId: string): Promise<boolean> {
    try {
      if (!isInitialized) {
        await this.initialize();
      }
      
      for (const project of projects) {
        const buildingIndex = project.buildings.findIndex(b => b.id === buildingId);
        if (buildingIndex !== -1) {
          project.buildings.splice(buildingIndex, 1);
          favoriteBuildings = favoriteBuildings.filter(fId => fId !== buildingId);
          await saveProjects();
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Erreur lors de la suppression du bâtiment:', error);
      return false;
    }
  },

  // Functional Zones
  async createFunctionalZone(buildingId: string, zoneData: Omit<FunctionalZone, 'id' | 'buildingId' | 'createdAt' | 'shutters'>): Promise<FunctionalZone | null> {
    try {
      if (!isInitialized) {
        await this.initialize();
      }
      
      for (const project of projects) {
        const building = project.buildings.find(b => b.id === buildingId);
        if (building) {
          const zone: FunctionalZone = {
            ...zoneData,
            id: generateUniqueId(),
            buildingId,
            createdAt: new Date(),
            shutters: []
          };
          building.functionalZones.push(zone);
          await saveProjects();
          return zone;
        }
      }
      return null;
    } catch (error) {
      console.error('Erreur lors de la création de la zone:', error);
      return null;
    }
  },

  async updateFunctionalZone(zoneId: string, updates: Partial<FunctionalZone>): Promise<FunctionalZone | null> {
    try {
      if (!isInitialized) {
        await this.initialize();
      }
      
      for (const project of projects) {
        for (const building of project.buildings) {
          const zoneIndex = building.functionalZones.findIndex(z => z.id === zoneId);
          if (zoneIndex !== -1) {
            building.functionalZones[zoneIndex] = { ...building.functionalZones[zoneIndex], ...updates };
            await saveProjects();
            return building.functionalZones[zoneIndex];
          }
        }
      }
      return null;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la zone:', error);
      return null;
    }
  },

  async deleteFunctionalZone(zoneId: string): Promise<boolean> {
    try {
      if (!isInitialized) {
        await this.initialize();
      }
      
      for (const project of projects) {
        for (const building of project.buildings) {
          const zoneIndex = building.functionalZones.findIndex(z => z.id === zoneId);
          if (zoneIndex !== -1) {
            building.functionalZones.splice(zoneIndex, 1);
            favoriteZones = favoriteZones.filter(fId => fId !== zoneId);
            await saveProjects();
            return true;
          }
        }
      }
      return false;
    } catch (error) {
      console.error('Erreur lors de la suppression de la zone:', error);
      return false;
    }
  },

  // Shutters
  async createShutter(zoneId: string, shutterData: Omit<Shutter, 'id' | 'zoneId' | 'createdAt' | 'updatedAt'>): Promise<Shutter | null> {
    try {
      if (!isInitialized) {
        await this.initialize();
      }
      
      for (const project of projects) {
        for (const building of project.buildings) {
          const zone = building.functionalZones.find(z => z.id === zoneId);
          if (zone) {
            const shutter: Shutter = {
              ...shutterData,
              id: generateUniqueId(),
              zoneId,
              createdAt: new Date(),
              updatedAt: new Date()
            };
            zone.shutters.push(shutter);
            await saveProjects();
            return shutter;
          }
        }
      }
      return null;
    } catch (error) {
      console.error('Erreur lors de la création du volet:', error);
      return null;
    }
  },

  async updateShutter(shutterId: string, updates: Partial<Shutter>): Promise<Shutter | null> {
    try {
      if (!isInitialized) {
        await this.initialize();
      }
      
      for (const project of projects) {
        for (const building of project.buildings) {
          for (const zone of building.functionalZones) {
            const shutterIndex = zone.shutters.findIndex(s => s.id === shutterId);
            if (shutterIndex !== -1) {
              zone.shutters[shutterIndex] = { ...zone.shutters[shutterIndex], ...updates, updatedAt: new Date() };
              await saveProjects();
              return zone.shutters[shutterIndex];
            }
          }
        }
      }
      return null;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du volet:', error);
      return null;
    }
  },

  async deleteShutter(shutterId: string): Promise<boolean> {
    try {
      if (!isInitialized) {
        await this.initialize();
      }
      
      for (const project of projects) {
        for (const building of project.buildings) {
          for (const zone of building.functionalZones) {
            const shutterIndex = zone.shutters.findIndex(s => s.id === shutterId);
            if (shutterIndex !== -1) {
              zone.shutters.splice(shutterIndex, 1);
              favoriteShutters = favoriteShutters.filter(fId => fId !== shutterId);
              await saveProjects();
              return true;
            }
          }
        }
      }
      return false;
    } catch (error) {
      console.error('Erreur lors de la suppression du volet:', error);
      return false;
    }
  },

  // Fonction de recherche
  async searchShutters(query: string): Promise<SearchResult[]> {
    try {
      if (!isInitialized) {
        await this.initialize();
      }
      
      const results: SearchResult[] = [];
      const queryWords = query.toLowerCase().trim().split(/\s+/).filter(word => word.length > 0);

      for (const project of projects) {
        for (const building of project.buildings) {
          for (const zone of building.functionalZones) {
            for (const shutter of zone.shutters) {
              const searchableText = [
                shutter.name,
                zone.name,
                building.name,
                project.name,
                project.city || '',
                shutter.remarks || ''
              ].join(' ').toLowerCase();
              
              const matchesAllWords = queryWords.every(word => searchableText.includes(word));
              
              if (matchesAllWords) {
                results.push({ shutter, zone, building, project });
              }
            }
          }
        }
      }

      return results;
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      return [];
    }
  },

  // Utilitaires de maintenance
  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        PROJECTS_KEY,
        FAVORITE_PROJECTS_KEY,
        FAVORITE_BUILDINGS_KEY,
        FAVORITE_ZONES_KEY,
        FAVORITE_SHUTTERS_KEY,
        QUICK_CALC_HISTORY_KEY
      ]);
      
      projects = [];
      favoriteProjects = [];
      favoriteBuildings = [];
      favoriteZones = [];
      favoriteShutters = [];
      quickCalcHistory = [];
      isInitialized = false;
    } catch (error) {
      console.error('Erreur lors de la suppression des données:', error);
      throw error;
    }
  },

  async getStorageInfo(): Promise<{
    projectsCount: number;
    totalShutters: number;
    storageSize: string;
  }> {
    try {
      if (!isInitialized) {
        await this.initialize();
      }
      
      const totalShutters = projects.reduce((total, project) => 
        total + project.buildings.reduce((buildingTotal, building) => 
          buildingTotal + building.functionalZones.reduce((zoneTotal, zone) => 
            zoneTotal + zone.shutters.length, 0), 0), 0);

      const dataString = JSON.stringify(projects);
      const storageSize = `${(dataString.length / 1024).toFixed(2)} KB`;

      return {
        projectsCount: projects.length,
        totalShutters,
        storageSize
      };
    } catch (error) {
      console.error('Erreur lors du calcul des infos de stockage:', error);
      return {
        projectsCount: 0,
        totalShutters: 0,
        storageSize: '0 KB'
      };
    }
  }
};
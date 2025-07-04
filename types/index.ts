export interface Project {
  id: string;
  name: string;
  mode?: 'smoke' | 'compartment' | 'complete'; // Optionnel pour compatibilité avec projets existants
  city?: string;
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  buildings: Building[];
}

// Helper pour obtenir le mode d'un projet (défaut: smoke pour compatibilité)
export function getProjectMode(project: Project): 'smoke' | 'compartment' | 'complete' {
  return project.mode || 'smoke';
}

export interface Building {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  createdAt: Date;
  functionalZones: FunctionalZone[];
  compartmentZones?: CompartmentZone[]; // Pour le mode compartimentage
}

export interface FunctionalZone {
  id: string;
  buildingId: string;
  name: string;
  description?: string;
  createdAt: Date;
  shutters: Shutter[];
}

export interface Shutter {
  id: string;
  zoneId: string;
  name: string;
  type: 'high' | 'low'; // Volet Haut ou Bas
  referenceFlow: number; // Débit de référence
  measuredFlow: number; // Débit mesuré
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ComplianceResult {
  deviation: number; // Écart en pourcentage
  status: 'compliant' | 'acceptable' | 'non-compliant';
  color: string;
  label: string;
}

export type ShutterType = 'high' | 'low';
export type ComplianceStatus = 'compliant' | 'acceptable' | 'non-compliant';

// Types pour le mode compartimentage
export interface CompartmentZone {
  id: string;
  buildingId: string;
  name: string;
  description?: string;
  createdAt: Date;
  devices: SafetyDevice[];
}

export interface SafetyDevice {
  id: string;
  zoneId: string; // ID de la CompartmentZone
  name: string;
  type: 'door' | 'damper'; // PCF (Porte Coupe-Feu) ou CCF (Clapet Coupe-Feu)
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Helper pour obtenir le préfixe des zones selon le mode
export function getZonePrefix(mode: 'smoke' | 'compartment' | 'complete', zoneType?: 'smoke' | 'compartment'): string {
  if (mode === 'complete' && zoneType) {
    return zoneType === 'smoke' ? 'ZF' : 'ZC';
  }
  return mode === 'compartment' ? 'ZC' : 'ZF';
}

// Search result interface
export interface SearchResult {
  shutter: Shutter;
  zone: FunctionalZone;
  building: Building;
  project: Project;
}
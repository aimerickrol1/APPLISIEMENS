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
```

The main issues were:

1. Missing closing bracket for the `getZonesToDisplay` function
2. Missing closing bracket for the `if/else` block
3. Improper nesting of the `sortedZones` declaration

The code is now properly structured with all required closing brackets in place.
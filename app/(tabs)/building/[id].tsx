Here's the fixed version with all missing closing brackets added:

```javascript
  const zonesToDisplay = getZonesToDisplay();
  const sortedZones = zonesToDisplay.sort((a, b) => {
    const aIsFavorite = favoriteZonesSet.has(a.id);
    const bIsFavorite = favoriteZonesSet.has(b.id);
    
    if (aIsFavorite && !bIsFavorite) return -1;
    if (!aIsFavorite && bIsFavorite) return 1;
    return 0;
  });

  return building.compartmentZones || []; // Zones de compartimentage uniquement
}
```

The main issues were:

1. Missing closing bracket for the `getZonesToDisplay` function
2. Missing closing bracket for the `if/else` block
3. Improper nesting of the `sortedZones` declaration

The code is now properly structured with all required closing brackets in place.
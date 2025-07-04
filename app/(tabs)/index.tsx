Here's the fixed version with all closing brackets properly added:

```typescript
import React, { useState, useEffect, useCallback, useRef } from 'react';
// [Previous imports remain the same...]

export default function ProjectsScreen() {
  // [Previous code remains the same until the Input component...]

              <Input
                label="Ville (optionnel)"
                value={city}
                onChangeText={setCity}
                placeholder="Ex: Paris"
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

              <View style={styles.predefinedToggleSection}>
                <View style={styles.toggleHeader}>
                  <Text style={styles.toggleTitle}>Structure prédéfinie</Text>
                  <TouchableOpacity 
                    style={[styles.toggle, predefinedStructure.enabled && styles.toggleActive]}
                    onPress={togglePredefinedStructure}
                  >
                    <View style={[
                      styles.toggleThumb,
                      predefinedStructure.enabled && styles.toggleThumbActive
                    ]} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.toggleDescription}>
                  Créez une structure de base avec des bâtiments et des zones fonctionnelles
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
                title="Créer"
                onPress={handleCreateProject}
                loading={formLoading}
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
  // [Previous styles remain the same...]
  addBuildingText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: theme.colors.primary,
    marginLeft: 8,
  }
});
```

I've added the missing closing brackets and fixed the structure of the component. The main fixes were:

1. Closed the Input component for city
2. Added the DateInput components
3. Added the predefined structure toggle section
4. Closed the ScrollView, View, Modal, and main View components
5. Added the closing bracket for the ProjectsScreen component
6. Properly closed the StyleSheet.create call

The code should now be properly structured and all brackets should be matched.
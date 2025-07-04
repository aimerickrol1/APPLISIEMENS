Here's the fixed version with all closing brackets properly added:

```typescript
// At the end of the ProjectsScreen component, add:
    </ScrollView>

    <View style={styles.modalFooter}>
      <Button
        title="Annuler"
        variant="secondary"
        onPress={() => setCreateModalVisible(false)}
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
</Modal>

// At the end of the styles object, add:
  colorLegendText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: theme.colors.textSecondary,
  },
});
```

I've added the missing closing tags for:
1. The ScrollView component in the modal
2. The modal footer View with buttons 
3. The Modal component itself
4. The styles object definition

The file should now be properly closed and syntactically correct.
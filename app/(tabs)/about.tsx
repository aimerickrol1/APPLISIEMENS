import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function About() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>About</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Compliance Criteria</Text>
          
          <View style={styles.criteriaItem}>
            <View style={[styles.criteriaIndicator, { backgroundColor: '#10B981' }]} />
            <View style={styles.criteriaContent}>
              <Text style={styles.criteriaLabel}>Conforme (|Écart| ≤ 10%)</Text>
              <Text style={styles.criteriaDescription}>
                Un écart inférieur ou égal à ±10% est considéré comme conforme aux exigences réglementaires.
              </Text>
            </View>
          </View>

          <View style={styles.criteriaItem}>
            <View style={[styles.criteriaIndicator, { backgroundColor: '#F59E0B' }]} />
            <View style={styles.criteriaContent}>
              <Text style={styles.criteriaLabel}>Acceptable (10% &lt; |Écart| ≤ 20%)</Text>
              <Text style={styles.criteriaDescription}>
                Un écart compris entre ±10% et ±20% conduit à signaler cette dérive, par une proposition d'action corrective à l'exploitant ou au chef d'établissement.
              </Text>
            </View>
          </View>

          <View style={styles.criteriaItem}>
            <View style={[styles.criteriaIndicator, { backgroundColor: '#EF4444' }]} />
            <View style={styles.criteriaContent}>
              <Text style={styles.criteriaLabel}>Non-conforme (|Écart| &gt; 20%)</Text>
              <Text style={styles.criteriaDescription}>
                Un écart supérieur à ±20% est considéré comme non-conforme et nécessite des actions correctives immédiates.
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 24,
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  criteriaItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  criteriaIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    marginRight: 12,
  },
  criteriaContent: {
    flex: 1,
  },
  criteriaLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  criteriaDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
});
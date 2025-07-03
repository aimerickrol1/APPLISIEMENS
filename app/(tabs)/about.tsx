import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Header } from '@/components/Header';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AboutScreen() {
  const { strings } = useLanguage();

  return (
    <View style={styles.container}>
      <Header title={strings.about} />
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.section}>
          <Text style={styles.title}>Compliance Criteria</Text>
          
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
              <Text style={styles.criteriaLabel}>Non conforme (|Écart| &gt; 20%)</Text>
              <Text style={styles.criteriaDescription}>
                Un écart supérieur à ±20% est considéré comme non conforme et nécessite des actions correctives immédiates.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>About This App</Text>
          <Text style={styles.description}>
            This application helps you manage compliance monitoring and tracking for various projects, buildings, zones, and shutters.
          </Text>
        </View>
      </ScrollView>
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
  contentContainer: {
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 24,
  },
  criteriaItem: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  criteriaIndicator: {
    width: 4,
    borderRadius: 2,
    marginRight: 12,
  },
  criteriaContent: {
    flex: 1,
  },
  criteriaLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  criteriaDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 20,
  },
});
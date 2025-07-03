import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';

export default function AboutScreen() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{t('about.title', 'About')}</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('about.app_info', 'Application Information')}</Text>
          <Text style={styles.text}>
            {t('about.description', 'This application helps manage building compliance and monitoring systems.')}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('about.compliance_criteria', 'Compliance Criteria')}</Text>
          
          <View style={styles.criteriaItem}>
            <View style={[styles.criteriaIndicator, { backgroundColor: '#10B981' }]} />
            <View style={styles.criteriaContent}>
              <Text style={styles.criteriaLabel}>
                {t('about.acceptable_range', 'Acceptable (|Écart| ≤ 10%)')}
              </Text>
              <Text style={styles.criteriaDescription}>
                {t('about.acceptable_description', 'Values within ±10% are considered acceptable and require no action.')}
              </Text>
            </View>
          </View>

          <View style={styles.criteriaItem}>
            <View style={[styles.criteriaIndicator, { backgroundColor: '#F59E0B' }]} />
            <View style={styles.criteriaContent}>
              <Text style={styles.criteriaLabel}>
                {t('about.warning_range', 'Warning (10% < |Écart| ≤ 20%)')}
              </Text>
              <Text style={styles.criteriaDescription}>
                {t('about.warning_description', 'Deviations between ±10% and ±20% require corrective action proposals.')}
              </Text>
            </View>
          </View>

          <View style={styles.criteriaItem}>
            <View style={[styles.criteriaIndicator, { backgroundColor: '#EF4444' }]} />
            <View style={styles.criteriaContent}>
              <Text style={styles.criteriaLabel}>
                {t('about.critical_range', 'Critical (|Écart| > 20%)')}
              </Text>
              <Text style={styles.criteriaDescription}>
                {t('about.critical_description', 'Deviations exceeding ±20% require immediate corrective measures.')}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('about.version', 'Version Information')}</Text>
          <Text style={styles.text}>Version 1.0.0</Text>
          <Text style={styles.text}>© 2024 Siemens AG</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 24,
    textAlign: 'center',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 16,
  },
  text: {
    fontSize: 16,
    color: theme.colors.text,
    lineHeight: 24,
    marginBottom: 8,
  },
  criteriaItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    padding: 16,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  criteriaIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
    marginTop: 4,
  },
  criteriaContent: {
    flex: 1,
  },
  criteriaLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  criteriaDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
});
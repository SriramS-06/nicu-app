import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getBabies } from '../api/babies';
import { getNutritionSummary } from '../api/nutrition';
import { getDailyWeight } from '../api/storage';
import { getDailyTargetForBaby } from '../api/targets';

export default function DashboardScreen({ navigation }: any) {
  const today = new Date().toISOString().split('T')[0];
  const { data: babies } = useQuery({
    queryKey: ['babies'],
    queryFn: getBabies
  });

  const { data: alertsSummary } = useQuery({
    queryKey: ['homeAlerts', babies, today],
    enabled: !!babies?.length,
    queryFn: async () => {
      let deficitCount = 0;
      let excessCount = 0;
      const metricKeys = [
        'calories', 'protein', 'sodium', 'potassium', 'calcium', 'phosphorous',
        'iron', 'zinc', 'vitamin_a', 'vitamin_d', 'vitamin_c', 'folic_acid', 'vitamin_b12', 'magnesium'
      ];
      for (const baby of babies) {
        try {
          const weight = await getDailyWeight(baby.id, today);
          if (!weight || weight <= 0) continue;
          const dayOfLife = Math.floor((new Date(today).getTime() - new Date(baby.dob).getTime()) / (1000 * 60 * 60 * 24)) + 1;
          const [summary, target] = await Promise.all([
            getNutritionSummary(baby.id, today),
            getDailyTargetForBaby(baby.id, dayOfLife, weight)
          ]);
          if (!summary || !target) continue;
          let hasDeficit = false;
          let hasExcess = false;
          metricKeys.forEach((metric) => {
            const perKg = (summary[metric] || 0) / weight;
            const minTarget = target[`${metric}_per_kg`];
            const maxTarget = target[`${metric}_per_kg_max`];
            if (minTarget === undefined || minTarget === null) return;
            const upper = maxTarget === undefined || maxTarget === null ? minTarget : maxTarget;
            if (perKg < minTarget) hasDeficit = true;
            if (perKg > upper) hasExcess = true;
          });
          if (hasDeficit) deficitCount += 1;
          if (hasExcess) excessCount += 1;
        } catch {
          // Ignore babies without today's summary/targets.
        }
      }
      return { deficitCount, excessCount };
    }
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>NICU Overview</Text>
        <Text style={styles.subtitle}>Daily Nutrition Summary</Text>
      </View>
      
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{babies?.length || 0}</Text>
          <Text style={styles.statLabel}>Active Babies</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{alertsSummary?.deficitCount || 0}</Text>
          <Text style={styles.statLabel}>Deficit Babies</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{alertsSummary?.excessCount || 0}</Text>
          <Text style={styles.statLabel}>Excess Babies</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Quick Actions</Text>
        <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Babies')}>
          <Text style={styles.buttonText}>View All Babies</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Settings')}>
          <Text style={styles.buttonText}>Manage Settings & Templates</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recent Activity</Text>
        <Text style={styles.placeholderText}>No recent activity</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0056b3',
  },
  subtitle: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'space-between',
  },
  statBox: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderTopWidth: 4,
    borderTopColor: '#0056b3',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  actionButton: {
    backgroundColor: '#e6f0fa',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#0056b3',
    fontSize: 16,
    fontWeight: '500',
  },
  placeholderText: {
    color: '#888',
    fontStyle: 'italic',
  }
});

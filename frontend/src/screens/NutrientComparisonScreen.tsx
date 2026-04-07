import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function NutrientComparisonScreen({ route }: any) {
  // Mock data for deficit/excess engine
  const target = { calories: 120, protein: 3.5, fat: 4.0 };
  const current = { calories: 95, protein: 3.6, fat: 2.0 };

  const getAlertColor = (currentVal: number, targetVal: number) => {
    const ratio = currentVal / targetVal;
    if (ratio < 0.9) return '#d9534f'; // Red -> Deficit
    if (ratio > 1.1) return '#f0ad4e'; // Orange -> Excess
    return '#5cb85c'; // Green -> Optimal
  };

  const nutrients = [
    { name: 'Calories (kcal/kg)', current: current.calories, target: target.calories },
    { name: 'Protein (g/kg)', current: current.protein, target: target.protein },
    { name: 'Fat (g/kg)', current: current.fat, target: target.fat },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Nutrient Comparison</Text>
        <Text style={styles.subtitle}>Intake vs Target Requirements</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.rowHeader}>
          <Text style={[styles.cell, { flex: 2, fontWeight: 'bold' }]}>Nutrient</Text>
          <Text style={[styles.cell, { fontWeight: 'bold' }]}>Intake</Text>
          <Text style={[styles.cell, { fontWeight: 'bold' }]}>Target</Text>
        </View>

        {nutrients.map((n, idx) => (
          <View key={idx} style={styles.row}>
            <Text style={[styles.cell, { flex: 2 }]}>{n.name}</Text>
            <View style={[styles.cell, styles.badgeContainer, { backgroundColor: getAlertColor(n.current, n.target) }]}>
              <Text style={styles.badgeText}>{n.current}</Text>
            </View>
            <Text style={[styles.cell]}>{n.target}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={[styles.title, { color: '#333', fontSize: 18, marginBottom: 10 }]}>7-Day Intake Trend (Calories)</Text>
        <View style={styles.chartContainer}>
          {[80, 85, 90, 92, 100, 95, 110].map((val, idx) => (
            <View key={idx} style={styles.barWrapper}>
              <View style={[styles.bar, { height: val }]} />
              <Text style={styles.barLabel}>{['M', 'T', 'W', 'T', 'F', 'S', 'S'][idx]}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: '#d9534f' }]} /><Text>Deficit</Text></View>
        <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: '#5cb85c' }]} /><Text>Optimal</Text></View>
        <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: '#f0ad4e' }]} /><Text>Excess</Text></View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  header: { padding: 20, backgroundColor: '#0056b3' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 14, color: '#e0e0e0', marginTop: 4 },
  card: { backgroundColor: '#fff', margin: 16, borderRadius: 8, elevation: 2, shadowColor: '#000', shadowOffset: {width:0, height:1}, shadowOpacity: 0.1, shadowRadius: 4, overflow: 'hidden' },
  rowHeader: { flexDirection: 'row', backgroundColor: '#eef2f5', padding: 12, borderBottomWidth: 1, borderBottomColor: '#ddd' },
  row: { flexDirection: 'row', padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee', alignItems: 'center' },
  cell: { flex: 1, fontSize: 14, color: '#333' },
  badgeContainer: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start', marginLeft: 10 },
  badgeText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  legend: { flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: 20, marginTop: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 12, height: 12, borderRadius: 6, marginRight: 6 },
  chartContainer: { flexDirection: 'row', height: 150, alignItems: 'flex-end', justifyContent: 'space-around', marginTop: 20 },
  barWrapper: { alignItems: 'center' },
  bar: { width: 20, backgroundColor: '#0056b3', borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  barLabel: { fontSize: 12, color: '#666', marginTop: 4 }
});

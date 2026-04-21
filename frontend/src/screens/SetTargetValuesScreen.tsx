import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getEspghanDefaults } from '../api/targets';

const DISPLAY_ROWS = [
  { key: 'calories',     label: 'Calories',      unit: 'kcal/kg/day' },
  { key: 'protein',      label: 'Protein',       unit: 'g/kg/day' },
  { key: 'fat',          label: 'Fat (Lipids)',   unit: 'g/kg/day' },
  { key: 'sodium',       label: 'Sodium',        unit: 'meq/kg/day' },
  { key: 'potassium',    label: 'Potassium',     unit: 'meq/kg/day' },
  { key: 'calcium',      label: 'Calcium',       unit: 'mg/kg/day' },
  { key: 'phosphorous',  label: 'Phosphorous',   unit: 'mg/kg/day' },
  { key: 'magnesium',    label: 'Magnesium',     unit: 'mg/kg/day' },
  { key: 'iron',         label: 'Iron',          unit: 'mg/kg/day' },
  { key: 'zinc',         label: 'Zinc',          unit: 'mg/day' },
  { key: 'vitamin_a',    label: 'Vitamin A',     unit: 'IU/kg/day' },
  { key: 'vitamin_d',    label: 'Vitamin D',     unit: 'IU/day' },
  { key: 'dha',          label: 'DHA',           unit: 'mg/kg/day' },
  { key: 'vitamin_c',    label: 'Vitamin C',     unit: 'mg/kg/day' },
  { key: 'folic_acid',   label: 'Folic Acid',    unit: 'μg/kg/day' },
  { key: 'vitamin_b12',  label: 'Vitamin B12',   unit: 'μg/kg/day' },
  { key: 'vitamin_e',    label: 'Vitamin E',     unit: 'mg/kg/day' },
];

export default function SetTargetValuesScreen() {
  const { data, isLoading } = useQuery({
    queryKey: ['espghanDefaults'],
    queryFn: getEspghanDefaults,
    staleTime: 300_000, // 5 minutes — rarely changes
  });

  const targets = data?.targets || data || {};
  const totalDayNutrients: string[] = data?.total_day_nutrients || ['vitamin_d', 'zinc'];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerCard}>
        <Text style={styles.title}>ESPGHAN 2022 Enteral Guidelines</Text>
        <Text style={styles.subtitle}>
          These targets are applied automatically to all babies. No manual setup needed.
        </Text>
      </View>

      <View style={styles.card}>
        {/* Warning banner */}
        <View style={styles.warningBanner}>
          <Text style={styles.warningEmoji}>⚠️</Text>
          <Text style={styles.warningText}>
            Zinc and Vitamin D targets are <Text style={{ fontWeight: '700' }}>total per day</Text> (not per kg).
            All other targets are per kg/day.
          </Text>
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color="#0056b3" style={{ marginVertical: 40 }} />
        ) : (
          <>
            {/* Table header */}
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Nutrient</Text>
              <Text style={styles.tableHeaderCell}>Min</Text>
              <Text style={styles.tableHeaderCell}>Max</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>Unit</Text>
            </View>

            {/* Table rows */}
            {DISPLAY_ROWS.map((row) => {
              const minVal = targets[`${row.key}_per_kg`];
              const maxVal = targets[`${row.key}_per_kg_max`];
              const isTotalDay = totalDayNutrients.includes(row.key);
              
              const formatVal = (v: any) => {
                if (v === undefined || v === null) return 'N/A';
                return String(v);
              };

              return (
                <View
                  key={row.key}
                  style={[
                    styles.tableRow,
                    isTotalDay ? styles.totalDayRow : {},
                  ]}
                >
                  <View style={[styles.tableCell, { flex: 1.5, flexDirection: 'row', alignItems: 'center' }]}>
                    {isTotalDay && <Text style={styles.badge}>⚠️</Text>}
                    <Text style={[styles.tableCellText, isTotalDay ? { fontWeight: '700' } : {}]}>
                      {row.label}
                    </Text>
                  </View>
                  <View style={styles.tableCell}>
                    <Text style={styles.tableCellText}>
                      {formatVal(minVal)}
                    </Text>
                  </View>
                  <View style={styles.tableCell}>
                    <Text style={styles.tableCellText}>
                      {formatVal(maxVal)}
                    </Text>
                  </View>
                  <View style={[styles.tableCell, { flex: 1.2 }]}>
                    <Text style={styles.unitText}>
                      {row.unit}
                    </Text>
                  </View>
                </View>
              );
            })}
          </>
        )}
      </View>

      {/* Legend card */}
      <View style={styles.legendCard}>
        <Text style={styles.legendTitle}>Color Coding in Baby Summary</Text>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: '#2e7d32' }]} />
          <Text style={styles.legendText}>Within target range</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: '#d32f2f' }]} />
          <Text style={styles.legendText}>Below minimum (Deficit)</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: '#f9a825' }]} />
          <Text style={styles.legendText}>Above maximum (Excess)</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: '#999' }]} />
          <Text style={styles.legendText}>No target (not alerting)</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  headerCard: {
    backgroundColor: '#0056b3',
    padding: 20,
    marginBottom: 0,
  },
  title: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 14, color: '#d0e4fa', marginTop: 6 },
  card: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 16,
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  warningBanner: {
    flexDirection: 'row',
    backgroundColor: '#fff8e1',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#f9a825',
    alignItems: 'flex-start',
  },
  warningEmoji: { fontSize: 18, marginRight: 8, marginTop: 1 },
  warningText: { flex: 1, fontSize: 13, color: '#5d4037', lineHeight: 20 },
  tableHeaderRow: {
    flexDirection: 'row',
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#0056b3',
    marginBottom: 2,
  },
  tableHeaderCell: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#0056b3',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  totalDayRow: {
    backgroundColor: '#fff8e1',
  },
  noTargetRow: {
    opacity: 0.5,
  },
  tableCell: {
    flex: 1,
    justifyContent: 'center',
  },
  tableCellText: {
    fontSize: 14,
    color: '#333',
  },
  unitText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  noTargetText: {
    color: '#aaa',
  },
  badge: {
    fontSize: 14,
    marginRight: 4,
  },
  legendCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    borderRadius: 8,
    padding: 16,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  legendTitle: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 12 },
  legendRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  legendDot: { width: 14, height: 14, borderRadius: 7, marginRight: 10 },
  legendText: { fontSize: 13, color: '#555' },
});

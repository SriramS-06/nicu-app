import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Alert, Platform, Dimensions } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteBaby, getBaby } from '../api/babies';
import { deleteNutritionLog, getNutritionSummary, getNutritionLogs } from '../api/nutrition';
import { useFocusEffect } from '@react-navigation/native';
import { getDailyWeight, saveDailyWeight } from '../api/storage';
import { getDailyTargetForBaby } from '../api/targets';

// Nutrients where the ESPGHAN target is TOTAL per day (not per kg)
const TOTAL_DAY_KEYS = ['vitamin_d', 'zinc'];

const NUTRIENT_METRICS = [
  { key: 'calories', label: 'Calories (kcal)' },
  { key: 'protein', label: 'Protein (g)' },
  { key: 'fat', label: 'Fat (g)' },
  { key: 'carbs', label: 'Carbs (g)' },
  { key: 'calcium', label: 'Calcium' },
  { key: 'phosphorous', label: 'Phosphorous' },
  { key: 'sodium', label: 'Sodium' },
  { key: 'potassium', label: 'Potassium' },
  { key: 'iron', label: 'Iron' },
  { key: 'zinc', label: 'Zinc (total/day)' },
  { key: 'vitamin_a', label: 'Vitamin A' },
  { key: 'vitamin_d', label: 'Vitamin D (total/day)' },
  { key: 'vitamin_c', label: 'Vitamin C' },
  { key: 'folic_acid', label: 'Folic Acid' },
  { key: 'vitamin_b12', label: 'Vitamin B12' },
  { key: 'magnesium', label: 'Magnesium' },
  { key: 'dha', label: 'DHA (mg)' },
  { key: 'vitamin_e', label: 'Vitamin E (mg)' },
] as const;

type HistoryDay = {
  date: string;
  logs: any[];
  totals: Record<string, number>;
};

type CalorieDay = {
  date: string;
  calories: number;
};

export default function BabyDetailScreen({ route, navigation }: any) {
  const { babyId } = route.params;
  const queryClient = useQueryClient();
  const todayDateStr = new Date().toISOString().split('T')[0];
  const [todayWeightInput, setTodayWeightInput] = React.useState('');
  const [todayWeight, setTodayWeight] = React.useState<number | null>(null);
  const [expandedHistoryDates, setExpandedHistoryDates] = React.useState<Record<string, boolean>>({});

  useFocusEffect(
    React.useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ['babySummary', babyId, todayDateStr] });
      queryClient.invalidateQueries({ queryKey: ['babyLogs', babyId] });
      queryClient.invalidateQueries({ queryKey: ['dailyTarget', babyId] });
    }, [babyId, todayDateStr])
  );

  const { data: babyDetails, isLoading } = useQuery({
    queryKey: ['baby', babyId],
    queryFn: () => getBaby(babyId),
    staleTime: 30_000,
  });

  const { data: summary, isLoading: isLoadingSummary } = useQuery({
    queryKey: ['babySummary', babyId, todayDateStr],
    queryFn: () => getNutritionSummary(babyId, todayDateStr),
    retry: false,
    staleTime: 30_000,
  });

  const { data: logs } = useQuery({
    queryKey: ['babyLogs', babyId],
    queryFn: () => getNutritionLogs(babyId),
    staleTime: 30_000,
  });

  React.useEffect(() => {
    const loadWeight = async () => {
      const stored = await getDailyWeight(babyId, todayDateStr);
      if (stored) {
        setTodayWeight(stored);
        setTodayWeightInput(String(stored));
      }
    };
    loadWeight();
  }, [babyId, todayDateStr]);

  const calculateDOL = (dob: string) => {
    if (!dob) return 0;
    const birthDate = new Date(dob);
    const currentDate = new Date();
    const diffTime = Math.abs(currentDate.getTime() - birthDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const dol = babyDetails?.dob ? calculateDOL(babyDetails.dob) : 0;

  const { data: dailyTarget } = useQuery({
    queryKey: ['dailyTarget', babyId, dol, todayWeight],
    enabled: !!todayWeight && !!babyDetails,
    queryFn: () => getDailyTargetForBaby(babyId, dol, todayWeight as number),
    staleTime: 30_000,
  });

  const todayLogs = logs?.filter((l: any) => l.date === todayDateStr) || [];
  const historicalLogs = logs?.filter((l: any) => l.date !== todayDateStr) || [];

  const historicalByDate = React.useMemo<HistoryDay[]>(() => {
    const grouped: Record<string, any[]> = historicalLogs.reduce((acc: Record<string, any[]>, log: any) => {
      if (!acc[log.date]) acc[log.date] = [];
      acc[log.date].push(log);
      return acc;
    }, {} as Record<string, any[]>);

    return Object.entries(grouped)
      .map(([date, dayLogs]: [string, any[]]) => {
        const totals = NUTRIENT_METRICS.reduce((acc, metric) => {
          acc[metric.key] = dayLogs.reduce((sum, log) => sum + (Number(log[metric.key]) || 0), 0);
          return acc;
        }, {} as Record<string, number>);

        return { date, logs: dayLogs, totals };
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [historicalLogs]);

  const calorieTrend = React.useMemo<CalorieDay[]>(() => {
    const grouped: Record<string, number> = (logs || []).reduce((acc: Record<string, number>, log: any) => {
      acc[log.date] = (acc[log.date] || 0) + (Number(log.calories) || 0);
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped)
      .map(([date, calories]: [string, number]) => ({ date, calories }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [logs]);

  const chartWidth = Math.max(Dimensions.get('window').width - 48, Math.max(calorieTrend.length, 1) * 72);
  const maxCalories = calorieTrend.length ? Math.max(...calorieTrend.map((point) => point.calories), 10) : 10;

  const toggleHistoryDate = (date: string) => {
    setExpandedHistoryDates((prev) => ({ ...prev, [date]: !prev[date] }));
  };

  if (isLoading) {
    return <View style={styles.container}><ActivityIndicator size="large" color="#0056b3" style={{marginTop: 50}} /></View>;
  }

  if (!babyDetails) {
    return <View style={styles.container}><Text style={styles.placeholderText}>Baby not found.</Text></View>;
  }

  const saveWeight = async () => {
    const parsed = parseFloat(todayWeightInput);
    if (!parsed || parsed <= 0) {
      Alert.alert('Weight required', 'Enter a valid weight for today.');
      return;
    }
    await saveDailyWeight(babyId, todayDateStr, parsed);
    setTodayWeight(parsed);
    // Immediately invalidate target so colors refresh
    queryClient.invalidateQueries({ queryKey: ['dailyTarget', babyId] });
  };

  const getStatusColor = (metricKey: string, total: number, perKgValue: number) => {
    const minTarget = dailyTarget?.[`${metricKey}_per_kg`];
    const maxTarget = dailyTarget?.[`${metricKey}_per_kg_max`];
    // No target set or target is 0 → neutral grey
    if (minTarget === undefined || minTarget === null || minTarget === 0) return '#666';
    const upper = maxTarget !== undefined && maxTarget !== null ? maxTarget : minTarget;

    // For zinc & vitamin D → compare TOTAL intake, not per-kg
    const compareValue = TOTAL_DAY_KEYS.includes(metricKey) ? total : perKgValue;

    if (compareValue < minTarget) return '#d32f2f';  // Deficit (red)
    if (compareValue > upper) return '#f9a825';      // Excess (amber)
    return '#2e7d32';                                 // Within range (green)
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.name}>{babyDetails.name}</Text>
        <Text style={styles.patientId}>Patient ID: {babyDetails.patient_id}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Details</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Date of Birth:</Text>
          <Text style={styles.value}>{babyDetails.dob}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Day of Life (DOL):</Text>
          <Text style={styles.valueHighlight}>{dol} days</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Admission Weight:</Text>
          <Text style={styles.value}>{babyDetails.weight} kg</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Gestational Age:</Text>
          <Text style={styles.value}>{babyDetails.gestational_age} weeks</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Daily Calories</Text>
        <Text style={styles.smallText}>Total calories logged for each date.</Text>
        {calorieTrend.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={[styles.chartWrapper, { width: chartWidth }]}>
              <View style={styles.chartYAxis}>
                {[maxCalories, Math.ceil(maxCalories * 0.75), Math.ceil(maxCalories * 0.5), Math.ceil(maxCalories * 0.25), 0].map((tick) => (
                  <Text key={tick} style={styles.chartYAxisLabel}>
                    {tick}
                  </Text>
                ))}
              </View>
              <View style={styles.chartBarsArea}>
                <View style={styles.chartBarsPlot}>
                  {calorieTrend.map((point) => {
                    const barHeight = Math.max((point.calories / maxCalories) * 170, point.calories > 0 ? 6 : 0);
                    return (
                      <View key={point.date} style={styles.chartBarColumn}>
                        <Text style={styles.chartBarValue}>{point.calories.toFixed(0)}</Text>
                        <View style={styles.chartBarTrack}>
                          <View style={[styles.chartBar, { height: barHeight }]} />
                        </View>
                        <Text style={styles.chartBarLabel}>{point.date.slice(5)}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>
          </ScrollView>
        ) : (
          <Text style={styles.placeholderText}>No calorie data available yet.</Text>
        )}
        {calorieTrend.length ? (
          <View style={styles.chartLegendRow}>
            <Text style={styles.chartLegendText}>Highest day: {maxCalories.toFixed(0)} kcal</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Today's Mandatory Weight</Text>
        <Text style={styles.smallText}>Enter today's weight before per-kg calculations and alerts are shown.</Text>
        <View style={styles.weightRow}>
          <TextInput
            value={todayWeightInput}
            onChangeText={setTodayWeightInput}
            keyboardType="numeric"
            placeholder="Weight in kg"
            style={styles.weightInput}
          />
          <TouchableOpacity style={styles.saveWeightButton} onPress={saveWeight}>
            <Text style={styles.saveWeightButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Today's Nutrition Summary</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => navigation.navigate('AddNutrition', { babyId: babyDetails.id })}
          >
            <Text style={styles.addButtonText}>+ Add Log</Text>
          </TouchableOpacity>
        </View>
        
        {isLoadingSummary ? (
           <ActivityIndicator size="small" />
        ) : summary ? (
           <View>
             {!todayWeight ? (
              <Text style={styles.placeholderText}>Please enter today's weight to view per kg/day calculations.</Text>
             ) : (
              <>
              <View style={styles.metricTableHeader}>
                <Text style={styles.metricHeaderName}>Metric</Text>
                <Text style={styles.metricHeaderValue}>Total</Text>
                <Text style={styles.metricHeaderValue}>Per Kg/Day</Text>
              </View>
              {NUTRIENT_METRICS.map((metric) => {
                const total = summary[metric.key] || 0;
                const perKg = total / todayWeight;
                const isTotalDay = TOTAL_DAY_KEYS.includes(metric.key);
                return (
                  <View key={metric.key} style={styles.metricTableRow}>
                    <Text style={styles.metricName}>{metric.label}</Text>
                    <Text style={[
                      styles.metricTotal,
                      { color: getStatusColor(metric.key, total, perKg), fontWeight: '700' }
                    ]}>
                      {total.toFixed(1)}
                    </Text>
                    {isTotalDay ? (
                      <Text style={[styles.metricPerKg, { color: '#999', fontStyle: 'italic' }]}>—</Text>
                    ) : (
                      <Text style={[styles.metricPerKg, { color: getStatusColor(metric.key, total, perKg) }]}>
                        {perKg.toFixed(2)}
                      </Text>
                    )}
                  </View>
                );
              })}
              </>
             )}

             <View style={styles.legendRow}>
               <Text style={[styles.legend, { color: '#2e7d32' }]}>● Within range</Text>
               <Text style={[styles.legend, { color: '#d32f2f' }]}>● Deficit</Text>
               <Text style={[styles.legend, { color: '#f9a825' }]}>● Excess</Text>
             </View>
             
             <View style={{ marginTop: 16, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 16 }}>
               <Text style={styles.sectionTitle}>Today's Logs</Text>
               {todayLogs.length > 0 ? todayLogs.map((log: any) => (
                 <View key={log.id} style={styles.logItem}>
                   <View>
                     <Text style={{ fontWeight: 'bold', color: '#333' }}>{log.feed_name}</Text>
                     <Text style={{ fontSize: 12, color: '#666' }}>Quantity: {log.quantity_ml ? log.quantity_ml + ' ml' : 'N/A'}</Text>
                   </View>
                   <View style={{ alignItems: 'flex-end' }}>
                     <Text style={{ fontWeight: '500', color: '#0056b3' }}>{log.calories.toFixed(1)} kcal</Text>
                     <TouchableOpacity
                       onPress={async () => {
                         try {
                           await deleteNutritionLog(log.id);
                           queryClient.invalidateQueries({ queryKey: ['babySummary', babyId, todayDateStr] });
                           queryClient.invalidateQueries({ queryKey: ['babyLogs', babyId] });
                         } catch (e: any) {
                           Alert.alert('Delete failed', e?.response?.data?.detail || 'Unable to delete this log.');
                         }
                       }}
                     >
                       <Text style={styles.logDeleteText}>Delete log</Text>
                     </TouchableOpacity>
                   </View>
                 </View>
               )) : <Text style={styles.placeholderText}>No individual logs found for today.</Text>}
             </View>
           </View>
        ) : (
           <Text style={styles.placeholderText}>Nutrient info will appear here once logs are added.</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Historical Records</Text>
        {!historicalByDate.length ? (
          <Text style={styles.placeholderText}>No historical logs yet.</Text>
        ) : (
          historicalByDate.map((day) => {
            const isExpanded = !!expandedHistoryDates[day.date];
            return (
              <View key={day.date} style={styles.historyDayCard}>
                <TouchableOpacity
                  style={styles.historyDayHeader}
                  onPress={() => toggleHistoryDate(day.date)}
                  activeOpacity={0.8}
                >
                  <View>
                    <Text style={styles.historyDateText}>{day.date}</Text>
                    <Text style={styles.historyCountText}>Nutrition count: {day.logs.length}</Text>
                  </View>
                  <Text style={styles.historyExpandText}>{isExpanded ? 'Hide feeds ▲' : 'Show feeds ▼'}</Text>
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.historyDropdown}>
                    <View style={styles.historySummaryBlock}>
                      <Text style={styles.historySummaryTitle}>Nutrition breakdown</Text>
                      <View style={styles.historySummaryGrid}>
                        {NUTRIENT_METRICS.map((metric) => (
                          <View key={metric.key} style={styles.historySummaryItem}>
                            <Text style={styles.historySummaryLabel}>{metric.label}</Text>
                            <Text style={styles.historySummaryValue}>
                              {(day.totals[metric.key] || 0).toFixed(1)}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                    {day.logs.map((log: any) => (
                      <View key={log.id} style={styles.historyFeedRow}>
                        <View>
                          <Text style={styles.historyFeedName}>{log.feed_name}</Text>
                          <Text style={styles.historyFeedMeta}>
                            {log.quantity_ml ? `${log.quantity_ml} ml` : 'Quantity N/A'}
                          </Text>
                        </View>
                        <Text style={styles.historyFeedKcal}>{log.calories.toFixed(1)} kcal</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })
        )}
      </View>

      <TouchableOpacity 
        style={styles.deleteButton} 
        onPress={async () => {
          const runDelete = async () => {
            try {
              await deleteBaby(babyDetails.id);
              queryClient.invalidateQueries({ queryKey: ['babies'] });
              navigation.goBack();
            } catch (e: any) {
              Alert.alert('Delete failed', e?.response?.data?.detail || 'Unable to delete baby record.');
            }
          };

          if (Platform.OS === 'web') {
            const ok = window.confirm(`Delete ${babyDetails.name}?`);
            if (ok) {
              runDelete();
            }
            return;
          }

          Alert.alert('Delete Baby', `Delete ${babyDetails.name}?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: runDelete }
          ]);
        }}
      >
        <Text style={styles.deleteButtonText}>Delete Baby Record</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    backgroundColor: '#0056b3',
    padding: 20,
    alignItems: 'center',
  },
  name: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  patientId: {
    fontSize: 16,
    color: '#e0e0e0',
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
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#0056b3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  label: {
    fontSize: 16,
    color: '#555',
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  valueHighlight: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0056b3',
  },
  smallText: { color: '#666', fontSize: 13, marginTop: 8, marginBottom: 10 },
  chartWrapper: {
    flexDirection: 'row',
    height: 240,
    paddingTop: 8,
  },
  chartYAxis: {
    width: 42,
    justifyContent: 'space-between',
    paddingRight: 8,
    paddingTop: 8,
    paddingBottom: 28,
  },
  chartYAxisLabel: {
    fontSize: 10,
    color: '#5a6b7d',
    textAlign: 'right',
  },
  chartBarsArea: {
    flex: 1,
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e7edf5',
    paddingLeft: 8,
    paddingBottom: 8,
  },
  chartBarsPlot: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  chartBarColumn: {
    width: 64,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 4,
  },
  chartBarValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
  },
  chartBarTrack: {
    width: 20,
    height: 170,
    justifyContent: 'flex-end',
    backgroundColor: '#eef3f8',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    overflow: 'hidden',
  },
  chartBar: {
    width: '100%',
    backgroundColor: '#0056b3',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  chartBarLabel: {
    marginTop: 6,
    fontSize: 10,
    color: '#5a6b7d',
    textAlign: 'center',
  },
  chartLegendRow: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  chartLegendText: {
    fontSize: 12,
    color: '#5a6b7d',
    fontWeight: '600',
  },
  weightRow: { flexDirection: 'row', alignItems: 'center' },
  weightInput: {
    flex: 1,
    height: 42,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fafafa'
  },
  saveWeightButton: {
    marginLeft: 8,
    backgroundColor: '#0056b3',
    borderRadius: 8,
    paddingHorizontal: 14,
    height: 42,
    justifyContent: 'center'
  },
  saveWeightButtonText: { color: '#fff', fontWeight: '600' },
  metricTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  metricName: { flex: 1.3, color: '#333', fontSize: 13 },
  metricTableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 6
  },
  metricHeaderName: { flex: 1.3, color: '#666', fontSize: 12, fontWeight: '700' },
  metricHeaderValue: { flex: 0.7, textAlign: 'right', color: '#666', fontSize: 12, fontWeight: '700' },
  metricTotal: { flex: 0.7, textAlign: 'right', color: '#333', fontWeight: '600' },
  metricPerKg: { flex: 0.7, textAlign: 'right', fontWeight: '700' },
  legendRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  legend: { fontSize: 12, fontWeight: '600' },
  placeholderText: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  deleteButton: {
    backgroundColor: '#ffebee',
    marginHorizontal: 16,
    marginBottom: 30,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffcdd2',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#d32f2f',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  logDeleteText: { color: '#d32f2f', marginTop: 4, fontSize: 12, fontWeight: '600' },
  historyDayCard: {
    borderWidth: 1,
    borderColor: '#e7edf5',
    borderRadius: 8,
    marginTop: 10,
    backgroundColor: '#fafcff',
  },
  historyDayHeader: {
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyDateText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f2d3d',
  },
  historyCountText: {
    marginTop: 2,
    fontSize: 12,
    color: '#5a6b7d',
  },
  historyExpandText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0056b3',
  },
  historyDropdown: {
    borderTopWidth: 1,
    borderTopColor: '#e7edf5',
    paddingHorizontal: 12,
    paddingBottom: 6,
  },
  historySummaryBlock: {
    paddingTop: 12,
    paddingBottom: 10,
  },
  historySummaryTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1f2d3d',
    marginBottom: 8,
  },
  historySummaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  historySummaryItem: {
    width: '50%',
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  historySummaryLabel: {
    fontSize: 11,
    color: '#6b7280',
  },
  historySummaryValue: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  historyFeedRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eef3f8',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyFeedName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  historyFeedMeta: {
    marginTop: 2,
    fontSize: 12,
    color: '#6b7280',
  },
  historyFeedKcal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  }
});

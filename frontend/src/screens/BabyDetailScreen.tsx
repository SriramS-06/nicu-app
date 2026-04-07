import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Alert, Platform } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteBaby, getBaby } from '../api/babies';
import { deleteNutritionLog, getNutritionSummary, getNutritionLogs } from '../api/nutrition';
import { useFocusEffect } from '@react-navigation/native';
import { getDailyWeight, saveDailyWeight } from '../api/storage';
import { getDailyTargetForBaby } from '../api/targets';

export default function BabyDetailScreen({ route, navigation }: any) {
  const { babyId } = route.params;
  const queryClient = useQueryClient();
  const todayDateStr = new Date().toISOString().split('T')[0];
  const [todayWeightInput, setTodayWeightInput] = React.useState('');
  const [todayWeight, setTodayWeight] = React.useState<number | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ['babySummary', babyId, todayDateStr] });
      queryClient.invalidateQueries({ queryKey: ['babyLogs', babyId] });
    }, [babyId, todayDateStr])
  );

  const { data: babyDetails, isLoading, error } = useQuery({
    queryKey: ['baby', babyId],
    queryFn: () => getBaby(babyId)
  });

  const { data: summary, isLoading: isLoadingSummary } = useQuery({
    queryKey: ['babySummary', babyId, todayDateStr],
    queryFn: () => getNutritionSummary(babyId, todayDateStr),
    retry: false
  });

  const { data: logs } = useQuery({
    queryKey: ['babyLogs', babyId],
    queryFn: () => getNutritionLogs(babyId)
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
    queryFn: () => getDailyTargetForBaby(babyId, dol, todayWeight as number)
  });

  if (isLoading) {
    return <View style={styles.container}><ActivityIndicator size="large" color="#0056b3" style={{marginTop: 50}} /></View>;
  }

  if (!babyDetails) {
    return <View style={styles.container}><Text style={styles.placeholderText}>Baby not found.</Text></View>;
  }

  const todayLogs = logs?.filter((l: any) => l.date === todayDateStr) || [];
  const historicalLogs = logs?.filter((l: any) => l.date !== todayDateStr) || [];
  const metrics = [
    { key: 'calories', label: 'Calories (kcal)' },
    { key: 'protein', label: 'Protein (g)' },
    { key: 'fat', label: 'Fat (g)' },
    { key: 'carbs', label: 'Carbs (g)' },
    { key: 'calcium', label: 'Calcium' },
    { key: 'phosphorous', label: 'Phosphorous' },
    { key: 'sodium', label: 'Sodium' },
    { key: 'potassium', label: 'Potassium' },
    { key: 'iron', label: 'Iron' },
    { key: 'zinc', label: 'Zinc' },
    { key: 'vitamin_a', label: 'Vitamin A' },
    { key: 'vitamin_d', label: 'Vitamin D' },
    { key: 'vitamin_c', label: 'Vitamin C' },
    { key: 'folic_acid', label: 'Folic Acid' },
    { key: 'vitamin_b12', label: 'Vitamin B12' },
    { key: 'magnesium', label: 'Magnesium' },
  ];

  const saveWeight = async () => {
    const parsed = parseFloat(todayWeightInput);
    if (!parsed || parsed <= 0) {
      Alert.alert('Weight required', 'Enter a valid weight for today.');
      return;
    }
    await saveDailyWeight(babyId, todayDateStr, parsed);
    setTodayWeight(parsed);
  };

  const getStatusColor = (metricKey: string, perKgValue: number) => {
    const minTarget = dailyTarget?.[`${metricKey}_per_kg`];
    const maxTarget = dailyTarget?.[`${metricKey}_per_kg_max`];
    if (minTarget === undefined || minTarget === null) return '#666';
    const upper = maxTarget === undefined || maxTarget === null ? minTarget : maxTarget;
    if (perKgValue < minTarget) return '#d32f2f';
    if (perKgValue > upper) return '#f9a825';
    return '#2e7d32';
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
              {metrics.map((metric) => {
                const total = summary[metric.key] || 0;
                const perKg = total / todayWeight;
                return (
                  <View key={metric.key} style={styles.metricTableRow}>
                    <Text style={styles.metricName}>{metric.label}</Text>
                    <Text style={styles.metricTotal}>{total.toFixed(1)}</Text>
                    <Text style={[styles.metricPerKg, { color: getStatusColor(metric.key, perKg) }]}>
                      {perKg.toFixed(2)}
                    </Text>
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
        {!historicalLogs.length ? (
          <Text style={styles.placeholderText}>No historical logs yet.</Text>
        ) : (
          historicalLogs.map((log: any) => (
            <View key={log.id} style={styles.logItem}>
              <View>
                <Text style={{ fontWeight: 'bold', color: '#333' }}>{log.feed_name}</Text>
                <Text style={{ fontSize: 12, color: '#666' }}>{log.date}</Text>
              </View>
              <Text style={{ color: '#333' }}>{log.calories.toFixed(1)} kcal</Text>
            </View>
          ))
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
  logDeleteText: { color: '#d32f2f', marginTop: 4, fontSize: 12, fontWeight: '600' }
});

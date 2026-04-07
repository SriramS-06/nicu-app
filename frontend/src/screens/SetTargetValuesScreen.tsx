import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useQuery } from '@tanstack/react-query';
import { getBabies } from '../api/babies';
import { createTarget } from '../api/targets';

const metricFields = [
  'calories_per_kg', 'protein_per_kg', 'fat_per_kg', 'sodium_per_kg', 'potassium_per_kg',
  'calcium_per_kg', 'phosphorous_per_kg', 'iron_per_kg', 'zinc_per_kg',
  'vitamin_a_per_kg', 'vitamin_d_per_kg', 'vitamin_c_per_kg', 'folic_acid_per_kg',
  'vitamin_b12_per_kg', 'magnesium_per_kg'
] as const;

export default function SetTargetValuesScreen() {
  const [selectedBabyId, setSelectedBabyId] = useState<string>('');
  const [weight, setWeight] = useState('');
  const [dateStr, setDateStr] = useState(new Date().toISOString().split('T')[0]);
  const [ackText, setAckText] = useState('');
  const [metricMins, setMetricMins] = useState<Record<string, string>>(
    metricFields.reduce((acc, key) => ({ ...acc, [key]: '' }), {} as Record<string, string>)
  );
  const [metricMaxs, setMetricMaxs] = useState<Record<string, string>>(
    metricFields.reduce((acc, key) => ({ ...acc, [key]: '' }), {} as Record<string, string>)
  );

  const { data: babies } = useQuery({
    queryKey: ['babies'],
    queryFn: getBabies
  });

  const selectedBaby = useMemo(
    () => babies?.find((b: any) => String(b.id) === selectedBabyId),
    [babies, selectedBabyId]
  );

  const dayOfLife = useMemo(() => {
    if (!selectedBaby?.dob || !dateStr) return 0;
    const dob = new Date(selectedBaby.dob);
    const current = new Date(dateStr);
    const diffMs = Math.max(0, current.getTime() - dob.getTime());
    return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
  }, [selectedBaby, dateStr]);

  const onSave = async () => {
    setAckText('');
    if (!selectedBabyId) {
      Alert.alert('Error', 'Select a baby first.');
      return;
    }
    const parsedWeight = parseFloat(weight);
    if (!parsedWeight || parsedWeight <= 0) {
      Alert.alert('Error', 'Enter a valid weight.');
      return;
    }

    try {
      const payload: any = {
        baby_id: parseInt(selectedBabyId, 10),
        min_day_of_life: dayOfLife,
        max_day_of_life: dayOfLife,
        weight_range_min: parsedWeight,
        weight_range_max: parsedWeight,
      };
      metricFields.forEach((key) => {
        const minValue = parseFloat(metricMins[key] || '0');
        const maxValue = parseFloat(metricMaxs[key] || metricMins[key] || '0');
        payload[key] = minValue;
        payload[`${key}_max`] = maxValue;
      });

      await createTarget(payload);
      setAckText(`Saved successfully for DOL ${dayOfLife}, weight ${parsedWeight} kg with nutrient min/max ranges.`);
      Alert.alert('Saved', 'Daily targets have been saved for this baby.');
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.detail || 'Failed to save daily targets.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Set Daily Targets</Text>
      <Text style={styles.subtitle}>Per-baby, per-day target values (per kg/day).</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Baby</Text>
        <View style={styles.pickerWrap}>
          <Picker selectedValue={selectedBabyId} onValueChange={(v) => setSelectedBabyId(v)}>
            <Picker.Item label="Select baby" value="" />
            {babies?.map((b: any) => <Picker.Item key={b.id} label={b.name} value={String(b.id)} />)}
          </Picker>
        </View>

        <Text style={styles.label}>Target Date (YYYY-MM-DD)</Text>
        <TextInput style={styles.input} value={dateStr} onChangeText={setDateStr} />

        <Text style={styles.label}>Day of Life (auto)</Text>
        <TextInput style={styles.input} value={String(dayOfLife || '')} editable={false} />
        <Text style={styles.label}>Weight (kg)</Text>
        <TextInput style={styles.input} value={weight} onChangeText={setWeight} keyboardType="numeric" placeholder="e.g. 2.5" />
        <Text style={styles.helper}>Nutrients are configured as Min and Max ranges.</Text>

        {metricFields.map((key) => (
          <View key={key} style={styles.metricRow}>
            <Text style={styles.metricLabel}>{key.replaceAll('_', ' ')}</Text>
            <TextInput style={styles.metricInput} value={metricMins[key]} onChangeText={(v) => setMetricMins((prev) => ({ ...prev, [key]: v }))} keyboardType="numeric" placeholder="Min" />
            <TextInput style={styles.metricInput} value={metricMaxs[key]} onChangeText={(v) => setMetricMaxs((prev) => ({ ...prev, [key]: v }))} keyboardType="numeric" placeholder="Max" />
          </View>
        ))}

        <TouchableOpacity style={styles.button} onPress={onSave}>
          <Text style={styles.buttonText}>Save Daily Targets</Text>
        </TouchableOpacity>
        {!!ackText && <Text style={styles.ackText}>{ackText}</Text>}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f7fa' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#0056b3', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 20 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 8 },
  label: { fontSize: 13, fontWeight: '600', color: '#333', marginTop: 6, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 12, height: 42, backgroundColor: '#fafafa' },
  pickerWrap: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, marginBottom: 6, backgroundColor: '#fafafa' },
  helper: { color: '#666', marginTop: 8, marginBottom: 12 },
  metricRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 8 },
  metricLabel: { color: '#333', fontSize: 13, flex: 1, marginRight: 8, textTransform: 'capitalize' },
  metricInput: { width: 80, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 8, height: 38, backgroundColor: '#fafafa' },
  button: { backgroundColor: '#0056b3', marginTop: 14, height: 46, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700' },
  ackText: { marginTop: 10, color: '#2e7d32', fontWeight: '600' },
});

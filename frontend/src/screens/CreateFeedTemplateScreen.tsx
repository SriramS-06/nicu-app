import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createFeedTemplate, deleteFeedTemplate, getFeedTemplates } from '../api/feedTemplates';

export default function CreateFeedTemplateScreen({ navigation }: any) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [baseQuantity, setBaseQuantity] = useState('100');

  // Nutrients
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [fat, setFat] = useState('');
  const [carbs, setCarbs] = useState('');
  const [calcium, setCalcium] = useState('');
  const [phosphorous, setPhosphorous] = useState('');
  const [sodium, setSodium] = useState('');
  const [potassium, setPotassium] = useState('');
  const [iron, setIron] = useState('');
  const [zinc, setZinc] = useState('');
  const [vitaminA, setVitaminA] = useState('');
  const [vitaminD, setVitaminD] = useState('');
  const [vitaminC, setVitaminC] = useState('');
  const [folicAcid, setFolicAcid] = useState('');
  const [vitaminB12, setVitaminB12] = useState('');
  const [magnesium, setMagnesium] = useState('');
  const { data: templates } = useQuery({
    queryKey: ['feedTemplates'],
    queryFn: getFeedTemplates
  });

  const handleCreate = async () => {
    if (!name || parseFloat(baseQuantity || '0') <= 0) {
      Alert.alert('Error', 'Name and a valid Base Quantity > 0 are required.');
      return;
    }
    
    try {
      await createFeedTemplate({
        name,
        base_quantity_ml: parseFloat(baseQuantity),
        calories: parseFloat(calories || '0'),
        protein: parseFloat(protein || '0'),
        fat: parseFloat(fat || '0'),
        carbs: parseFloat(carbs || '0'),
        calcium: parseFloat(calcium || '0'),
        phosphorous: parseFloat(phosphorous || '0'),
        sodium: parseFloat(sodium || '0'),
        potassium: parseFloat(potassium || '0'),
        iron: parseFloat(iron || '0'),
        zinc: parseFloat(zinc || '0'),
        vitamin_a: parseFloat(vitaminA || '0'),
        vitamin_d: parseFloat(vitaminD || '0'),
        vitamin_c: parseFloat(vitaminC || '0'),
        folic_acid: parseFloat(folicAcid || '0'),
        vitamin_b12: parseFloat(vitaminB12 || '0'),
        magnesium: parseFloat(magnesium || '0'),
      });
      queryClient.invalidateQueries({ queryKey: ['feedTemplates'] });
      Alert.alert('Success', 'Feed Template Created');
      navigation.goBack();
    } catch (e: any) {
      console.error(e);
      Alert.alert('Error', e?.response?.data?.detail || 'Failed to create template. Only admin can do this.');
    }
  };

  const handleDeleteTemplate = (template: any) => {
    const runDelete = async () => {
      try {
        await deleteFeedTemplate(template.id);
        queryClient.invalidateQueries({ queryKey: ['feedTemplates'] });
      } catch (e: any) {
        Alert.alert('Error', e?.response?.data?.detail || 'Failed to delete template');
      }
    };

    if (Platform.OS === 'web') {
      const ok = window.confirm(`Delete "${template.name}"?`);
      if (ok) {
        runDelete();
      }
      return;
    }

    Alert.alert(
      'Delete Template',
      `Delete "${template.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: runDelete
        }
      ]
    );
  };

  const renderInput = (label: string, value: string, setter: any, keyboard="numeric") => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput 
        style={styles.input} 
        value={value} 
        onChangeText={setter}
        keyboardType={keyboard as any}
        placeholder="0"
      />
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Create New Feed / Drug</Text>
        
        {renderInput('Template Name', name, setName, 'default')}
        {renderInput('Base Quantity Level (ml)', baseQuantity, setBaseQuantity)}
        
        <Text style={styles.sectionHeader}>Nutrients per Base Quantity</Text>
        
        <View style={styles.grid}>
          {renderInput('Calories (kcal)', calories, setCalories)}
          {renderInput('Protein (g)', protein, setProtein)}
          {renderInput('Fat (g)', fat, setFat)}
          {renderInput('Carbs (g)', carbs, setCarbs)}
          {renderInput('Calcium', calcium, setCalcium)}
          {renderInput('Phosphorous', phosphorous, setPhosphorous)}
          {renderInput('Sodium', sodium, setSodium)}
          {renderInput('Potassium', potassium, setPotassium)}
          {renderInput('Iron', iron, setIron)}
          {renderInput('Zinc', zinc, setZinc)}
          {renderInput('Vitamin A', vitaminA, setVitaminA)}
          {renderInput('Vitamin D', vitaminD, setVitaminD)}
          {renderInput('Vitamin C', vitaminC, setVitaminC)}
          {renderInput('Folic Acid', folicAcid, setFolicAcid)}
          {renderInput('Vitamin B12', vitaminB12, setVitaminB12)}
          {renderInput('Magnesium', magnesium, setMagnesium)}
        </View>

        <TouchableOpacity style={styles.button} onPress={handleCreate}>
          <Text style={styles.buttonText}>Create Template</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Existing Templates</Text>
        {!templates?.length ? (
          <Text style={styles.emptyText}>No templates yet.</Text>
        ) : (
          templates.map((template: any) => (
            <View key={template.id} style={styles.templateRow}>
              <Text style={styles.templateName}>{template.name}</Text>
              <TouchableOpacity style={styles.deletePill} onPress={() => handleDeleteTemplate(template)}>
                <Text style={styles.deletePillText}>Delete</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa', padding: 16 },
  card: { backgroundColor: '#ffffff', padding: 20, borderRadius: 8, elevation: 2, marginBottom: 40 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#0056b3', marginBottom: 20 },
  sectionHeader: { fontSize: 16, fontWeight: 'bold', color: '#333', marginTop: 10, marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  inputGroup: { width: '48%' },
  label: { fontSize: 12, color: '#333', marginBottom: 4, fontWeight: '500' },
  input: { height: 44, borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, paddingHorizontal: 12, marginBottom: 12, backgroundColor: '#f9f9f9', fontSize: 14 },
  button: { backgroundColor: '#0056b3', height: 48, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 12 },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  templateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  templateName: { color: '#333', fontSize: 14, flex: 1, marginRight: 8 },
  deletePill: { backgroundColor: '#ffebee', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  deletePillText: { color: '#d32f2f', fontWeight: '600', fontSize: 12 },
  emptyText: { color: '#888', fontStyle: 'italic' }
});

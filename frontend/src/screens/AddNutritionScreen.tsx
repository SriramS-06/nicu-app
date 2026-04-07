import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { createNutritionLog } from '../api/nutrition';
import { getFeedTemplates } from '../api/feedTemplates';
import { Picker } from '@react-native-picker/picker'; // You might need to make sure this is installed or use substitute

export default function AddNutritionScreen({ route, navigation }: any) {
  const { babyId } = route?.params || { babyId: 1 };
  
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [feedName, setFeedName] = useState('');
  const [quantity, setQuantity] = useState('');

  // 16 Manual Nutrients
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

  const [selectedTemplateId, setSelectedTemplateId] = useState<any>('');

  // Calculate Nutrients effect when template or quantity changes
  useEffect(() => {
    if (selectedTemplateId && quantity && templates) {
      const template = templates.find((t: any) => t.id.toString() === selectedTemplateId.toString());
      if (template) {
        setFeedName(template.name);
        const ratio = parseFloat(quantity) / (template.base_quantity_ml || 100.0);
        
        setCalories((template.calories * ratio).toFixed(2));
        setProtein((template.protein * ratio).toFixed(2));
        setFat((template.fat * ratio).toFixed(2));
        setCarbs((template.carbs * ratio).toFixed(2));
        setCalcium((template.calcium * ratio).toFixed(2));
        setPhosphorous((template.phosphorous * ratio).toFixed(2));
        setSodium((template.sodium * ratio).toFixed(2));
        setPotassium((template.potassium * ratio).toFixed(2));
        setIron((template.iron * ratio).toFixed(2));
        setZinc((template.zinc * ratio).toFixed(2));
        setVitaminA((template.vitamin_a * ratio).toFixed(2));
        setVitaminD((template.vitamin_d * ratio).toFixed(2));
        setVitaminC((template.vitamin_c * ratio).toFixed(2));
        setFolicAcid((template.folic_acid * ratio).toFixed(2));
        setVitaminB12((template.vitamin_b12 * ratio).toFixed(2));
        setMagnesium((template.magnesium * ratio).toFixed(2));
      }
    }
  }, [selectedTemplateId, quantity, templates]);

  const handleSave = async () => {
    if (!feedName || !date) {
      Alert.alert('Error', 'Feed Name and Date are highly required.');
      return;
    }
    
    try {
      await createNutritionLog({
        baby_id: babyId,
        date: date,
        feed_name: feedName,
        quantity_ml: quantity ? parseFloat(quantity) : null,
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
      Alert.alert('Success', 'Manual Entry Log Saved!');
      navigation.goBack();
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to save log.');
    }
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
        <Text style={styles.title}>Add Nutrition Log</Text>
        <Text style={styles.subtitle}>Baby ID: {babyId}</Text>
        
        <Text style={styles.sectionHeader}>General Info</Text>
        {renderInput('Date (YYYY-MM-DD)', date, setDate, 'default')}
        
        <Text style={styles.label}>Select Feed / Drug Template (Optional)</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedTemplateId}
            onValueChange={(itemValue) => setSelectedTemplateId(itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="-- None (Manual Entry) --" value="" />
            {templates?.map((t: any) => (
              <Picker.Item key={t.id.toString()} label={`${t.name} (${t.base_quantity_ml}ml)`} value={t.id.toString()} />
            ))}
          </Picker>
        </View>

        {renderInput('Feed / Drug Name', feedName, setFeedName, 'default')}
        {renderInput('Quantity (ml) (Required for Auto-calc)', quantity, setQuantity)}

        <Text style={styles.sectionHeader}>Nutrient Profile</Text>
        <Text style={styles.warningText}>Fields auto-calculate if you choose a template and quantity, but you can override them before saving.</Text>
        
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

        <TouchableOpacity style={styles.button} onPress={handleSave}>
          <Text style={styles.buttonText}>Save Log</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa', padding: 16 },
  card: { backgroundColor: '#ffffff', padding: 20, borderRadius: 8, elevation: 2, marginBottom: 40 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#0056b3', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 20 },
  pickerContainer: { borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, marginBottom: 12, backgroundColor: '#f9f9f9' },
  picker: { height: 44, width: '100%' },
  sectionHeader: { fontSize: 16, fontWeight: 'bold', color: '#333', marginTop: 10, marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 4 },
  warningText: { fontSize: 12, color: '#d32f2f', marginBottom: 16, fontStyle: 'italic' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  inputGroup: { width: '48%' },
  label: { fontSize: 12, color: '#333', marginBottom: 4, fontWeight: '500' },
  input: { height: 44, borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, paddingHorizontal: 12, marginBottom: 12, backgroundColor: '#f9f9f9', fontSize: 14 },
  button: { backgroundColor: '#0056b3', height: 48, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 12 },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' }
});

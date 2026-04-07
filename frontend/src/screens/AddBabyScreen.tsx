import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { createBaby } from '../api/babies';

export default function AddBabyScreen({ navigation }: any) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [patientId, setPatientId] = useState('');
  const [dob, setDob] = useState('');
  const [weight, setWeight] = useState('');
  const [gestationalAge, setGestationalAge] = useState('');

  const handleAddBaby = async () => {
    if (!name || !patientId || !dob || !weight || !gestationalAge) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    try {
      await createBaby({
        name,
        patient_id: patientId,
        dob,
        weight: parseFloat(weight),
        gestational_age: parseInt(gestationalAge, 10),
      });
      queryClient.invalidateQueries({ queryKey: ['babies'] });
      Alert.alert('Success', 'Baby added successfully');
      navigation.goBack();
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to add baby. Are you an admin?');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Add New Patient</Text>

      <View style={styles.card}>
        <TextInput style={styles.input} placeholder="Name" value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="Patient ID" value={patientId} onChangeText={setPatientId} />
        <TextInput style={styles.input} placeholder="Date of Birth (YYYY-MM-DD)" value={dob} onChangeText={setDob} />
        <TextInput style={styles.input} placeholder="Weight (kg)" keyboardType="numeric" value={weight} onChangeText={setWeight} />
        <TextInput style={styles.input} placeholder="Gestational Age (weeks)" keyboardType="numeric" value={gestationalAge} onChangeText={setGestationalAge} />

        <TouchableOpacity style={styles.button} onPress={handleAddBaby}>
          <Text style={styles.buttonText}>Save Baby</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f7fa' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#0056b3', marginBottom: 20 },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 8, elevation: 2 },
  input: {
    height: 50,
    backgroundColor: '#f8f9fa',
    borderColor: '#e9ecef',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#0056b3',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { color: '#ffffff', fontSize: 18, fontWeight: '600' },
});

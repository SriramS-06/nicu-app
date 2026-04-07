import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getBabies } from '../api/babies';

export default function BabyListScreen({ navigation }: any) {
  const { data: babies, isLoading, error } = useQuery({
    queryKey: ['babies'],
    queryFn: getBabies
  });

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('BabyDetail', { babyId: item.id })}
    >
      <Text style={styles.babyName}>{item.name}</Text>
      <Text style={styles.babyInfo}>Patient ID: {item.patient_id}</Text>
      <Text style={styles.babyInfo}>Weight: {item.weight} kg | Gestational Age: {item.gestational_age} wks</Text>
    </TouchableOpacity>
  );

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#0056b3" /></View>;
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => navigation.navigate('AddBaby')}
      >
        <Text style={styles.addButtonText}>+ Add New Patient</Text>
      </TouchableOpacity>
      
      <FlatList
        data={babies || []}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={<Text style={styles.placeholderText}>No babies found.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#0056b3',
  },
  addButton: {
    backgroundColor: '#0056b3',
    margin: 16,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  babyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0056b3',
    marginBottom: 4,
  },
  babyInfo: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 2,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  placeholderText: {
    textAlign: 'center',
    color: '#888',
    fontStyle: 'italic',
    marginTop: 20
  }
});

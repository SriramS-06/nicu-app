import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import { logout } from '../api/auth';

export default function SettingsScreen({ navigation }: any) {
  const handleLogout = async () => {
    await logout();
    // In a real app we'd dispatch a navigation reset or use React Context
    // Here we just navigate back to Login
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings & Management</Text>
      
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('CreateFeedTemplate')}>
        <Text style={styles.buttonText}>Manage Feed Templates</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('SetTargetValues')}>
        <Text style={styles.buttonText}>Set Target Values</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={[styles.button, styles.logoutButton]} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f7fa',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0056b3',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  logoutButton: {
    marginTop: 20,
    backgroundColor: '#ffebee',
    borderWidth: 1,
    borderColor: '#ffcdd2',
  },
  logoutButtonText: {
    fontSize: 16,
    color: '#d32f2f',
    fontWeight: 'bold',
    textAlign: 'center',
  }
});

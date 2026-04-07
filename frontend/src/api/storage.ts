import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export async function saveToken(value: string) {
  if (Platform.OS === 'web') {
    localStorage.setItem('token', value);
  } else {
    await SecureStore.setItemAsync('token', value);
  }
}

export async function getToken() {
  if (Platform.OS === 'web') {
    return localStorage.getItem('token');
  } else {
    return await SecureStore.getItemAsync('token');
  }
}

export async function deleteToken() {
  if (Platform.OS === 'web') {
    localStorage.removeItem('token');
  } else {
    await SecureStore.deleteItemAsync('token');
  }
}

export async function saveDailyWeight(babyId: number, dateStr: string, weight: number) {
  const key = `daily_weight_${babyId}_${dateStr}`;
  if (Platform.OS === 'web') {
    localStorage.setItem(key, String(weight));
  } else {
    await SecureStore.setItemAsync(key, String(weight));
  }
}

export async function getDailyWeight(babyId: number, dateStr: string) {
  const key = `daily_weight_${babyId}_${dateStr}`;
  if (Platform.OS === 'web') {
    const value = localStorage.getItem(key);
    return value ? parseFloat(value) : null;
  }
  const value = await SecureStore.getItemAsync(key);
  return value ? parseFloat(value) : null;
}

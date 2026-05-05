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

import api from './client';
import { Platform } from 'react-native';

export type DailyWeightRecord = {
  id: number;
  baby_id: number;
  date: string;
  weight: number;
};

export const getDailyWeightsForBaby = async (babyId: number) => {
  const response = await api.get(`/daily-weights/baby/${babyId}`);
  const records = response.data as DailyWeightRecord[];

  if (records.length || Platform.OS !== 'web') {
    return records;
  }

  const prefix = `daily_weight_${babyId}_`;
  const localRecords: DailyWeightRecord[] = [];

  Object.keys(localStorage)
    .filter((key) => key.startsWith(prefix))
    .forEach((key) => {
      const date = key.slice(prefix.length);
      const weight = parseFloat(localStorage.getItem(key) || '');
      if (date && Number.isFinite(weight)) {
        localRecords.push({
          id: 0,
          baby_id: babyId,
          date,
          weight,
        });
      }
    });

  if (!localRecords.length) {
    return records;
  }

  await Promise.all(localRecords.map((record) => api.post(`/daily-weights/baby/${babyId}`, {
    date: record.date,
    weight: record.weight,
  })));

  const refreshed = await api.get(`/daily-weights/baby/${babyId}`);
  return refreshed.data as DailyWeightRecord[];
};

export const getDailyWeight = async (babyId: number, dateStr: string) => {
  const records = await getDailyWeightsForBaby(babyId);
  return records.find((record) => record.date === dateStr)?.weight ?? null;
};

export const saveDailyWeight = async (babyId: number, dateStr: string, weight: number) => {
  const response = await api.post(`/daily-weights/baby/${babyId}`, {
    date: dateStr,
    weight,
  });
  if (Platform.OS === 'web') {
    localStorage.setItem(`daily_weight_${babyId}_${dateStr}`, String(weight));
  }
  return response.data as DailyWeightRecord;
};

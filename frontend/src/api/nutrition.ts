import api from './client';

export const createNutritionLog = async (logData: any) => {
  const response = await api.post('/nutrition/', logData);
  return response.data;
};

export const getNutritionLogs = async (babyId: number) => {
  const response = await api.get(`/nutrition/baby/${babyId}/`);
  return response.data;
};

export const getNutritionSummary = async (babyId: number, dateStr: string) => {
  try {
    const response = await api.get(`/nutrition/baby/${babyId}/summary`, {
      params: { summary_date: dateStr }
    });
    return response.data;
  } catch (error: any) {
    if (error?.response?.status === 404) {
      return null;
    }
    throw error;
  }
};

export const deleteNutritionLog = async (logId: number) => {
  const response = await api.delete(`/nutrition/${logId}`);
  return response.data;
};

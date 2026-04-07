import api from './client';

export const getTargets = async () => {
  const response = await api.get('/targets');
  return response.data;
};

export const getTarget = async (id: number) => {
  const response = await api.get(`/targets/${id}`);
  return response.data;
};

export const createTarget = async (targetData: any) => {
  const response = await api.post('/targets', targetData);
  return response.data;
};

export const getDailyTargetForBaby = async (babyId: number, dayOfLife: number, weight: number) => {
  const response = await api.get(`/targets/baby/${babyId}/daily`, {
    params: { day_of_life: dayOfLife, weight }
  });
  return response.data;
};

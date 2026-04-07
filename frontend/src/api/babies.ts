import api from './client';

export const getBabies = async () => {
  const response = await api.get('/babies/');
  return response.data;
};

export const getBaby = async (id: number) => {
  const response = await api.get(`/babies/${id}`);
  return response.data;
};

export const createBaby = async (babyData: any) => {
  const response = await api.post('/babies/', babyData);
  return response.data;
};

export const deleteBaby = async (id: number) => {
  const response = await api.delete(`/babies/${id}`);
  return response.data;
};

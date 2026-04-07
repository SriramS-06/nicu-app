import api from './client';

export const getFeedTemplates = async () => {
  const response = await api.get('/feed-templates/');
  return response.data;
};

export const createFeedTemplate = async (templateData: any) => {
  const response = await api.post('/feed-templates/', templateData);
  return response.data;
};

export const deleteFeedTemplate = async (templateId: number) => {
  const response = await api.delete(`/feed-templates/${templateId}`);
  return response.data;
};

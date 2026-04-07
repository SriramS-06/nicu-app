import api from './client';
import { saveToken, deleteToken, getToken as _getToken } from './storage';

export const login = async (username: string, password: string) => {
  const params = new URLSearchParams();
  params.append('username', username.trim());
  params.append('password', password);

  // FastAPI OAuth2PasswordRequestForm expects form-data
  const response = await api.post('/auth/login', params.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  const { access_token } = response.data;
  await saveToken(access_token);
  return response.data;
};

export const logout = async () => {
  await deleteToken();
};

export const getToken = async () => {
  return await _getToken();
};

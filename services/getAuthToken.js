import { getStoredAccessToken } from '../utils/authTokenStorage';

export const getAuthTokenOrThrow = async () => {
  const token = await getStoredAccessToken();
  if (!token) {
    throw new Error('User is not authenticated.');
  }
  return token;
};

export const getAuthTokenOrNull = async () => {
  try {
    return await getStoredAccessToken();
  } catch {
    return null;
  }
};

import { API_URL as CONFIG_API_URL } from '../config';
import { getAuthTokenOrNull } from './getAuthToken';

// Metro/Hermes doesn't support import.meta; rely on RN config for the API URL
const API_URL = CONFIG_API_URL;

const getToken = async () => getAuthTokenOrNull();

/**
 * Fetch Children's Class curriculum by identifier or grade via `/api/curriculum/:id`.
 * The backend accepts either a Mongo ObjectId or a grade key: 'Preschool', '1', '2', '2b'.
 */
export const fetchChildrensCurriculum = async (gradeOrId) => {
  if (!gradeOrId) throw new Error('gradeOrId is required');
  const token = await getToken();
  const id = encodeURIComponent(String(gradeOrId).trim());
  const url = `${API_URL}/api/curriculum/${id}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const data = await res.json();
      message = data?.message || message;
    } catch (_) {
      // ignore body parse error
    }
    throw new Error(message || "Failed to fetch children's class curriculum");
  }

  return res.json();
};

/**
 * Fetch a specific curriculum by its id.
 */
export const fetchCurriculumById = async (curriculumId) => {
  if (!curriculumId) throw new Error('curriculumId is required');
  const token = await getToken();
  const url = `${API_URL}/api/curriculum/${encodeURIComponent(curriculumId)}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const data = await res.json();
      message = data?.message || message;
    } catch (_) {}
    throw new Error(message || 'Failed to fetch curriculum');
  }

  return res.json();
};

export default {
  fetchChildrensCurriculum,
  fetchCurriculumById,
};

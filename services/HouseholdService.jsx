import { API_URL } from '../config';
import { buildJsonHeaders, requestJson } from './http';

export const fetchHouseholdByMemberId = async (memberId, token) => {
  const { data } = await requestJson(
    `${API_URL}/api/households/by-member/${encodeURIComponent(memberId)}`,
    {
      method: 'GET',
      headers: buildJsonHeaders(token),
    },
    'Failed to fetch household',
  );

  return data;
};

export const updateHouseholdSelfSettings = async (householdId, patch, token) => {
  const { data } = await requestJson(
    `${API_URL}/api/households/${encodeURIComponent(householdId)}/self-settings`,
    {
      method: 'PUT',
      headers: buildJsonHeaders(token),
      body: JSON.stringify(patch),
    },
    'Failed to update household settings',
  );

  return data;
};

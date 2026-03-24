import { API_URL as MOBILE_API_URL } from '../config';
import { buildJsonHeaders, requestJson } from './http';
import debugLog from '../utils/debugLog';
import { getAccessTokenMemory, getStoredAccessToken } from '../utils/authTokenStorage';

const API_URL = MOBILE_API_URL || '';
const SESSIONS_BASE = '/api/sessions';

const resolveToken = async () => getAccessTokenMemory() || await getStoredAccessToken();

const buildQueryString = (params = {}) => {
  const entries = Object.entries(params).filter(([, value]) => value !== undefined && value !== null);
  if (!entries.length) return '';
  const query = new URLSearchParams(entries).toString();
  return query ? `?${query}` : '';
};

const makeRequest = async (path, method = 'GET', body = null, config = {}) => {
  const {
    params,
    headers = {},
    signal,
    returnJson = method === 'GET',
    token: overrideToken,
  } = config;

  let url = path;
  if (params) {
    url += buildQueryString(params);
  }

  const token = overrideToken ?? await resolveToken();
  const requestUrl = `${API_URL}${url}`;

  debugLog('[SessionService] request', {
    url: requestUrl,
    method,
    hasToken: Boolean(token),
    params,
    body: body ? { ...body } : null,
  });

  const { data } = await requestJson(
    requestUrl,
    {
      method,
      headers: {
        ...buildJsonHeaders(token),
        ...headers,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal,
    },
    `Error ${method} ${url}`,
  );

  return returnJson ? data : true;
};

export const fetchSessions = (options = {}) =>
  makeRequest(SESSIONS_BASE, 'GET', null, options);

export const fetchSessionById = (sessionId, options = {}) =>
  makeRequest(`${SESSIONS_BASE}/${encodeURIComponent(sessionId)}`, 'GET', null, options);

export const createSession = (activityId, sessionData, options = {}) =>
  makeRequest(`${SESSIONS_BASE}/${encodeURIComponent(activityId)}/create`, 'POST', sessionData, {
    returnJson: true,
    ...options,
  });

export const updateSession = (sessionId, updates, options = {}) =>
  makeRequest(`${SESSIONS_BASE}/${encodeURIComponent(sessionId)}`, 'PATCH', updates, {
    returnJson: true,
    ...options,
  });

export const deleteSession = (sessionId, options = {}) =>
  makeRequest(`${SESSIONS_BASE}/${encodeURIComponent(sessionId)}`, 'DELETE', null, options);

export const cancelSession = (sessionId, options = {}) =>
  makeRequest(`${SESSIONS_BASE}/${encodeURIComponent(sessionId)}/cancel`, 'POST', null, {
    returnJson: true,
    ...options,
  });

export const confirmSession = (sessionId, options = {}) =>
  makeRequest(`${SESSIONS_BASE}/${encodeURIComponent(sessionId)}/confirm`, 'GET', null, options);

export const requestSessionParticipation = (sessionId, options = {}) =>
  makeRequest(`${SESSIONS_BASE}/${encodeURIComponent(sessionId)}/request-participation`, 'POST', null, options);

export const cancelSessionParticipationRequest = (sessionId, userId, options = {}) =>
  makeRequest(`${SESSIONS_BASE}/${encodeURIComponent(sessionId)}/cancel-request-participation/${encodeURIComponent(userId)}`, 'POST', null, options);

export const requestSessionFacilitator = (sessionId, options = {}) =>
  makeRequest(`${SESSIONS_BASE}/${encodeURIComponent(sessionId)}/request-facilitation`, 'POST', null, options);

export const cancelSessionFacilitatorRequest = (sessionId, userId, options = {}) =>
  makeRequest(`${SESSIONS_BASE}/${encodeURIComponent(sessionId)}/cancel-request-facilitation/${encodeURIComponent(userId)}`, 'POST', null, options);

export const approveSessionParticipant = (sessionId, participantId, options = {}) =>
  makeRequest(`${SESSIONS_BASE}/${encodeURIComponent(sessionId)}/approve-participant/${encodeURIComponent(participantId)}`, 'POST', null, options);

export const denySessionParticipant = (sessionId, participantId, options = {}) =>
  makeRequest(`${SESSIONS_BASE}/${encodeURIComponent(sessionId)}/deny-participant/${encodeURIComponent(participantId)}`, 'POST', null, options);

export const approveSessionFacilitator = (sessionId, facilitatorId, options = {}) =>
  makeRequest(`${SESSIONS_BASE}/${encodeURIComponent(sessionId)}/approve-facilitator/${encodeURIComponent(facilitatorId)}`, 'POST', null, options);

export const denySessionFacilitator = (sessionId, facilitatorId, options = {}) =>
  makeRequest(`${SESSIONS_BASE}/${encodeURIComponent(sessionId)}/deny-facilitator/${encodeURIComponent(facilitatorId)}`, 'POST', null, options);

export const leaveSessionAsParticipant = (sessionId, userId, options = {}) =>
  makeRequest(`${SESSIONS_BASE}/${encodeURIComponent(sessionId)}/leave-participant/${encodeURIComponent(userId)}`, 'POST', null, options);

export const leaveSessionAsFacilitator = (sessionId, userId, options = {}) =>
  makeRequest(`${SESSIONS_BASE}/${encodeURIComponent(sessionId)}/leave-facilitator/${encodeURIComponent(userId)}`, 'POST', null, options);

export default {
  fetchSessions,
  fetchSessionById,
  createSession,
  updateSession,
  deleteSession,
  cancelSession,
  confirmSession,
  requestSessionParticipation,
  cancelSessionParticipationRequest,
  requestSessionFacilitator,
  cancelSessionFacilitatorRequest,
  approveSessionParticipant,
  denySessionParticipant,
  approveSessionFacilitator,
  denySessionFacilitator,
  leaveSessionAsParticipant,
  leaveSessionAsFacilitator,
};

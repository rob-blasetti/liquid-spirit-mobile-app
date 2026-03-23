import { API_URL } from '../config';
import { buildJsonHeaders, requestJson } from './http';
import debugLog from '../utils/debugLog';

const makeRequest = async (url, method, token, body = null, config = {}) => {
  try {
    const requestUrl = config.params
      ? `${API_URL}${url}?${new URLSearchParams(config.params).toString()}`
      : `${API_URL}${url}`;

    const { data } = await requestJson(
      requestUrl,
      {
        method,
        headers: {
          ...buildJsonHeaders(token),
          ...(config.headers || {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      },
      'Request failed',
    );

    return method === 'GET' ? data : true;
  } catch (error) {
    console.error(`Error in ${method} request to ${url}:`, error);
    throw error;
  }
};

export const fetchActivities = (token) => makeRequest('/api/activities', 'GET', token);
export const fetchActivityDetails = (activityId, token) => makeRequest(`/api/activities/${activityId}`, 'GET', token);
export const fetchActivityDetailsWithCertifications = (activityId, token) => makeRequest(`/api/activities/${activityId}/certifications`, 'GET', token);
export const fetchUserActivities = (userId, token) =>
  makeRequest(`/api/activities/user/${userId}`, 'GET', token);

export const uploadActivityDetailsImage = async (file, activityId, token) => {
  try {
    const extensionMatch = file?.name?.match(/\.[0-9a-z]+$/i);
    const extension = extensionMatch?.[0] || '.jpg';
    const fileName = `activity-${activityId}-${Date.now()}${extension}`;

    debugLog('Fetching pre-signed URL for activity image upload');
    const signedUrlResponse = await makeRequest('/api/upload/s3-url', 'GET', null, {
      params: {
        fileName,
        fileType: file.type,
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const signedUrl = signedUrlResponse?.url;
    if (!signedUrl) {
      throw new Error('Failed to get signed URL for activity image');
    }

    const uploadResponse = await fetch(signedUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
      },
      body: file,
    });
    if (!uploadResponse.ok) {
      throw new Error(`Failed to upload file to S3: ${uploadResponse.statusText || uploadResponse.status}`);
    }
    debugLog('File uploaded successfully to S3');

    const imgUrl = signedUrl.split('?')[0];

    await makeRequest(`/api/activities/${activityId}/image`, 'PATCH', token, {
      imageUrl: imgUrl,
    });

    return { stage: 'completed', message: 'Image upload and activity update complete!', imgUrl };
  } catch (error) {
    console.error('Error uploading activity image:', error);

    throw { stage: 'error', message: error.message || 'An unexpected error occurred during upload.' };
  }
};


export const requestParticipation = (activityId, userId, token) => makeRequest(`/api/activities/${activityId}/request-participation/${userId}`, 'POST', token);
export const requestFacilitator = (activityId, userId, token) => makeRequest(`/api/activities/${activityId}/request-facilitation/${userId}`, 'POST', token);

export const cancelRequestParticipation = (activityId, userId, token) => makeRequest(`/api/activities/${activityId}/cancel-request-participation/${userId}`, 'POST', token);
export const cancelRequestFacilitator = (activityId, userId, token) => makeRequest(`/api/activities/${activityId}/cancel-request-facilitation/${userId}`, 'POST', token);

export const approveParticipation = (activityId, userId, token) => makeRequest(`/api/activities/${activityId}/approve-participant/${userId}`, 'POST', token);
export const approveFacilitator = (activityId, userId, token) => makeRequest(`/api/activities/${activityId}/approve-facilitator/${userId}`, 'POST', token);

// Deny a participant's request to join an activity
export const denyParticipationRequest = (activityId, userId, token) =>
  makeRequest(
    // endpoint should match /approve-participant naming (deny-participant)
    `/api/activities/${activityId}/deny-participant/${userId}`,
    'POST',
    token
  );
export const denyFacilitatorRequest = (activityId, userId, token) => makeRequest(`/api/activities/${activityId}/deny-facilitator/${userId}`, 'POST', token);

export const leaveParticipation = (activityId, userId, token) => makeRequest(`/api/activities/${activityId}/leave-participant/${userId}`, 'POST', token);
export const leaveFacilitator = (activityId, userId, token) => makeRequest(`/api/activities/${activityId}/leave-facilitator/${userId}`, 'POST', token);

// Create a new activity
export const createActivity = (activityData, token) => {
  debugLog('[ActivityService] createActivity payload:', activityData);
  return makeRequest('/api/activities/create', 'POST', token, activityData);
};

export const createSession = (activityId, sessionData, token) => {
  if (!activityId) {
    return Promise.reject(new Error('Activity ID is required to create a session.'));
  }
  return makeRequest(`/api/activities/${activityId}/sessions`, 'POST', token, sessionData);
};

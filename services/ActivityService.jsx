import { API_URL } from '../config';

const makeRequest = async (url, method, token, body = null, config = {}) => {
  try {
    if (config.params) {
      const queryString = new URLSearchParams(config.params).toString();
      url += `?${queryString}`;
    }

    const response = await fetch(`${API_URL}${url}`, {
      method: method,
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
        ...config.headers,
      },
      body: body ? JSON.stringify(body) : null,
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message);
    }

    return method === 'GET' ? response.json() : true;
  } catch (error) {
    console.error(`Error in ${method} request to ${url}:`, error);
    throw error;
  }
};

export const fetchActivities = (token) => makeRequest('/api/activities', 'GET', token);
export const fetchActivityDetails = (activityId, token) => makeRequest(`/api/activities/${activityId}`, 'GET', token);
export const fetchActivityDetailsWithCertifications = (activityId, token) => makeRequest(`/api/activities/${activityId}/certifications`, 'GET', token);

export const uploadActivityDetailsImage = async (file, activityId, token) => {
  try {
    const fileName = `activity-${activityId}-${Date.now()}${file.name.match(/\.[0-9a-z]+$/i)[0]}`;

    // Get pre-signed URL from backend
    console.log('Fetching pre-signed URL...');
    const { url: signedUrl } = await makeRequest('/api/upload/s3-url', 'GET', null, {
      params: {
        fileName,
        fileType: file.type,
      },
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    await fetch(signedUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
      },
      body: file,
    }).then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to upload file to S3: ${response.statusText}`);
      }
      console.log('File uploaded successfully to S3');
    });

    let imgUrl = signedUrl.split('?')[0];

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

export const denyParticipationRequest = (activityId, userId, token) => makeRequest(`/api/activities/${activityId}/deny-participation/${userId}`, 'POST', token);
export const denyFacilitatorRequest = (activityId, userId, token) => makeRequest(`/api/activities/${activityId}/deny-facilitator/${userId}`, 'POST', token);

export const leaveParticipation = (activityId, userId, token) => makeRequest(`/api/activities/${activityId}/leave-participant/${userId}`, 'POST', token);
export const leaveFacilitator = (activityId, userId, token) => makeRequest(`/api/activities/${activityId}/leave-facilitator/${userId}`, 'POST', token);
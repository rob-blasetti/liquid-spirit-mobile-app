import { jwtDecode } from 'jwt-decode';

import { API_URL } from '../config';

export const fetchLocalSpiritualAssembly = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        console.warn('No token found, returning empty array.');
        return [];
    }

    try {
        const response = await fetch(`${API_URL}/api/bodies/local-spiritual-assembly`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            console.error(`Failed to fetch: ${response.status} - ${response.statusText}`);
            return [];
        }

        const data = await response.json();
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error('Error fetching Local Spiritual Assembly:', error);
        return [];
    }
};

export const fetchFeastCommittee = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        console.warn('No token found, returning empty array.');
        return [];
    }

    try {
        const response = await fetch(`${API_URL}/api/bodies/feast-committee`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            console.error(`Failed to fetch: ${response.status} - ${response.statusText}`);
            return [];
        }

        const data = await response.json();
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error('Error fetching Feast Committee:', error);
        return [];
    }
};

export const fetchHolyDaysCommittee = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        console.warn('No token found, returning empty array.');
        return [];
    }

    try {
        const response = await fetch(`${API_URL}/api/bodies/holy-days-committee`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            console.error(`Failed to fetch: ${response.status} - ${response.statusText}`);
            return [];
        }

        const data = await response.json();
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error('Error fetching Holy Days Committee:', error);
        return [];
    }
};

export const createUserBody = async (userBodyData) => {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
        const response = await fetch(`${API_URL}/api/bodies`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(userBodyData)
        });
        if (!response.ok) {
            throw new Error('Failed to create User-Body relationship');
        }
        return await response.json();
    } catch (error) {
        console.error('Error creating User-Body:', error);
        return null;
    }
};

/**
 * Updates a User-Body relationship.
 */
export const updateUserBody = async (userBodyData) => {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
        const response = await fetch(`${API_URL}/api/bodies`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(userBodyData)
        });
        if (!response.ok) {
            throw new Error('Failed to update User-Body relationship');
        }
        return await response.json();
    } catch (error) {
        console.error('Error updating User-Body:', error);
        return null;
    }
};

/**
 * Deletes a User-Body relationship.
 */
export const deleteUserBody = async (userId, bodyId) => {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
        const response = await fetch(`${API_URL}/api/bodies/${userId}/${bodyId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            throw new Error('Failed to delete User-Body relationship');
        }
        return await response.json();
    } catch (error) {
        console.error('Error deleting User-Body:', error);
        return null;
    }
};

export const fetchIsMemberOfFeastCommittee = async (userId, communityId) => {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
        const response = await fetch(`${API_URL}/api/bodies/feast-committee/${communityId}/${userId}/is-member`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            throw new Error('Failed to fetch is member of Feast Committee');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching is member of Feast Committee:', error);
        return null;
    }
};

export const fetchIsMemberOfHolyDaysCommittee = async (userId, communityId) => {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
        const response = await fetch(`${API_URL}/api/bodies/holy-days-committee/${communityId}/${userId}/is-member`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            throw new Error('Failed to fetch is member of Holy Days Committee');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching is member of Holy Days Committee:', error);
        return null;
    }
};

export const fetchIsMemberOfLocalSpiritualAssembly = async (userId, communityId) => {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
        const response = await fetch(`${API_URL}/api/bodies/local-spiritual-assembly/${communityId}/${userId}/is-member`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            throw new Error('Failed to fetch is member of Local Spiritual Assembly');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching is member of Local Spiritual Assembly:', error);
        return null;
    }
};
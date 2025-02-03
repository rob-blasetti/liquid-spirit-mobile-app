import { jwtDecode } from 'jwt-decode';

import API_URL from '../config';
import { UserContext } from '../contexts/UserContext';
import { useContext } from 'react';

export const signIn = async (email, password) => {
  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();

    if (response.ok && data.token) {
      // Store the token in localStorage
      localStorage.setItem('token', data.token);
    }

    return { ok: response.ok, data };
  } catch (error) {
    throw new Error(`Sign-in error: ${error.message}`);
  }
};

export const signUp = async (email, bahaiId, password) => {
  try {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, bahaiId, password }),
    });
    const data = await response.json();

    if (response.ok && data.token) {
      // Store the token in localStorage
      localStorage.setItem('token', data.token);
    }

    return { ok: response.ok, data };
  } catch (error) {
    throw new Error(`Sign-up error: ${error.message}`);
  }
};

export const verify = async (bahaiId, verificationCode, password) => {
  try {
    const response = await fetch(`${API_URL}/api/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ bahaiId, verificationCode, password }),
    });
    const data = await response.json();
    console.log('data: ', data);

    if (response.ok && data.token) {
      // Store the token in localStorage
      localStorage.setItem('token', data.token);
    }

    return { ok: response.ok, data };
  } catch (error) {
    throw new Error(`Sign-up error: ${error.message}`);
  }
};

export const fetchMe = async () => {
  const { token } = useContext(UserContext); // Get token from Context

  try {
    const response = await fetch(`${API_URL}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    const data = await response.json();
    return { ok: response.ok, data };
  } catch (error) {
    throw new Error(`Sign-in error: ${error.message}`);
  }
};

export const updateMe = async (updatedUser) => {
  const { token } = useContext(UserContext); // Get token from Context

  try {
    const response = await fetch(`${API_URL}/api/auth/me`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedUser), // Include updatedUser in the body
    });

    const data = await response.json();
    return { ok: response.ok, data };
  } catch (error) {
    throw new Error(`Update error: ${error.message}`);
  }
};

export const getCurrentUserId = () => {
  const { token } = useContext(UserContext); // Get token from Context
  // Retrieve token inside function
  if (!token) return null;

  try {
    const decoded = jwtDecode(token);
    return decoded.userId || decoded.id;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

export const checkTokenExpiration = () => {
  const { token } = useContext(UserContext); // Get token from Context

  if (!token) {
    console.error('No token found');
    return { isValid: false, reason: 'No token found' }; // No token found
  }

  // Check if token has the correct format with 3 parts
  const tokenParts = token.split('.');
  if (tokenParts.length !== 3) {
    console.error('Invalid token format');
    return { isValid: false, reason: 'Invalid token format' }; // Invalid token format
  }

  try {
    const decodedToken = jwtDecode(token);

    // Check if the token has expired
    if (decodedToken.exp * 1000 < Date.now()) {
      console.warn('Token has expired');
      return { isValid: false, reason: 'Token expired' }; // Token expired
    }

    return { isValid: true }; // Token is valid
  } catch (error) {
    console.error('Error decoding token', error);
    return { isValid: false, reason: 'Error decoding token' }; // Decoding error
  }
};

export const googleSignIn = async (idToken) => {
  try {
    const response = await fetch(`${API_URL}/api/auth/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: idToken }),
    });

    const data = await response.json();

    if (response.ok && data.token) {
      // Store the token in localStorage
      localStorage.setItem('token', data.token);
      return { ok: true, data };
    } else {
      return { ok: false, data };
    }
  } catch (error) {
    throw new Error(`Google sign-in error: ${error.message}`);
  }
};

// Retrieve and parse user information from token after Google sign-in
export const fetchGoogleUserInfo = () => {
  const { token } = useContext(UserContext); // Get token from Context

  if (!token) return null;

  try {
    const decoded = jwtDecode(token);
    return decoded;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

import { useContext } from 'react';
import { UserContext } from '../contexts/UserContext';
import { jwtDecode } from 'jwt-decode';
import { API_URL } from '../config';

// By wrapping our functions into a custom hook, we can retrieve 'token' and 'setToken' only once at the top.
// Then we can reuse them in the exported methods without repeating useContext calls.

export const useAuthService = () => {
  const { token, setToken } = useContext(UserContext);

  const signIn = async (email, password) => {
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
        setToken(data.token);
      }

      return { ok: response.ok, data };
    } catch (error) {
      throw new Error(`Sign-in error: ${error.message}`);
    }
  };

  const signUp = async (email, bahaiId, password) => {
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
        setToken(data.token);
      }

      return { ok: response.ok, data };
    } catch (error) {
      throw new Error(`Sign-up error: ${error.message}`);
    }
  };

  const verify = async (bahaiId, verificationCode, password) => {
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
        setToken(data.token);
      }

      return { ok: response.ok, data };
    } catch (error) {
      throw new Error(`Sign-up error: ${error.message}`);
    }
  };

  const forgotPassword = async (email) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      if (response.ok && data.token) {
        setToken(data.token);
      }

      return { ok: response.ok, data };
    } catch (error) {
      throw new Error(`Sign-up error: ${error.message}`);
    }
  };

  const fetchMe = async () => {
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

  const updateMe = async (updatedUser) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedUser),
      });

      const data = await response.json();
      return { ok: response.ok, data };
    } catch (error) {
      throw new Error(`Update error: ${error.message}`);
    }
  };

  const getCurrentUserId = () => {
    if (!token) return null;

    try {
      const decoded = jwtDecode(token);
      return decoded.userId || decoded.id;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };

  const checkTokenExpiration = () => {
    if (!token) {
      console.error('No token found');
      return { isValid: false, reason: 'No token found' };
    }

    // Check if token has the correct format with 3 parts
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      console.error('Invalid token format');
      return { isValid: false, reason: 'Invalid token format' };
    }

    try {
      const decodedToken = jwtDecode(token);

      // Check if the token has expired
      if (decodedToken.exp * 1000 < Date.now()) {
        console.warn('Token has expired');
        return { isValid: false, reason: 'Token expired' };
      }

      return { isValid: true };
    } catch (error) {
      console.error('Error decoding token', error);
      return { isValid: false, reason: 'Error decoding token' };
    }
  };

  const googleSignIn = async (idToken) => {
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
        setToken(data.token);
        return { ok: true, data };
      } else {
        return { ok: false, data };
      }
    } catch (error) {
      throw new Error(`Google sign-in error: ${error.message}`);
    }
  };

  // Retrieve and parse user information from token after Google sign-in
  const fetchGoogleUserInfo = () => {
    if (!token) return null;

    try {
      const decoded = jwtDecode(token);
      return decoded;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };

  return {
    token,
    signIn,
    signUp,
    verify,
    forgotPassword,
    fetchMe,
    updateMe,
    getCurrentUserId,
    checkTokenExpiration,
    googleSignIn,
    fetchGoogleUserInfo,
  };
};

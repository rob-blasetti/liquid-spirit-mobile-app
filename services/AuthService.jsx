import { useContext } from 'react';
import { Platform } from 'react-native';
import { UserContext } from '../contexts/UserContext';
import jwtDecode from 'jwt-decode';
import { Passkey } from './passkeyCompat';
import { fetchPasskeyCredentialsWithToken } from './PasskeyService';

import { API_URL, AUTH_API_URL } from '../config';
import { isJwtExpired, resolveAccessToken, resolveRefreshToken } from '../utils/authTokens';
import debugLog from '../utils/debugLog';

const decodeToken = (token) => {
  if (!token) return null;
  try {
    return jwtDecode(token);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

const extractUserId = (decodedToken) => {
  if (!decodedToken) return null;
  return decodedToken.userId || decodedToken.id || decodedToken._id || null;
};

const AUTH_BASE = String(AUTH_API_URL || API_URL || '').replace(/\/$/, '');

const resolveTokenFromResult = payload => resolveAccessToken(payload);
const resolveUserFromResult = payload =>
  payload?.user || payload?.me || payload?.data?.user || payload?.data?.me || null;

const redactSensitiveValue = (key, value) => {
  const normalizedKey = String(key || '').toLowerCase();
  if (
    normalizedKey.includes('password') ||
    normalizedKey.includes('token') ||
    normalizedKey.includes('secret') ||
    normalizedKey.includes('authorization')
  ) {
    return '[redacted]';
  }

  return value;
};

const redactSensitiveObject = (value) => {
  if (Array.isArray(value)) {
    return value.map(item => redactSensitiveObject(item));
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  return Object.entries(value).reduce((acc, [key, nestedValue]) => {
    const redactedValue = redactSensitiveValue(key, nestedValue);
    acc[key] = redactedValue === nestedValue ? redactSensitiveObject(nestedValue) : redactedValue;
    return acc;
  }, {});
};

const resolveUserIdFromToken = (tokenValue) => {
  if (!tokenValue) return null;
  const decoded = decodeToken(tokenValue);
  return extractUserId(decoded);
};

export const useAuthService = () => {
  const { token, setToken, login } = useContext(UserContext);

  const jsonHeaders = (withAuth = false) => ({
    'Content-Type': 'application/json',
    ...(withAuth && token ? { Authorization: `Bearer ${token}` } : {}),
  });

  const fetchJson = async (url, options = {}) => {
    const response = await fetch(url, options);
    const rawBody = await response.text();
    let data = null;

    if (rawBody) {
      try {
        data = JSON.parse(rawBody);
      } catch {
        data = rawBody;
      }
    }

    return { response, data };
  };

  const requestPasskeyPayload = async (url, body = null, withAuth = false, method = 'POST') => {
    const hasBody = body !== null && body !== undefined;
    const requestMethod = method || (hasBody ? 'POST' : 'GET');

    const { response, data } = await fetchJson(url, {
      method: requestMethod,
      headers: jsonHeaders(withAuth),
      ...(hasBody ? { body: JSON.stringify(body) } : {}),
    });

    return { response, data };
  };

  const signIn = async (email, password) => {
    const url = `${AUTH_BASE}/api/auth/login`;
    const requestBody = { email, password };

    try {
      console.log('[AuthService] login request', {
        url,
        method: 'POST',
        body: redactSensitiveObject(requestBody),
      });

      const { response, data } = await fetchJson(url, {
        method: 'POST',
        headers: jsonHeaders(false),
        body: JSON.stringify(requestBody),
      });

      console.log('[AuthService] login response', {
        url,
        status: response.status,
        ok: response.ok,
        data: redactSensitiveObject(data),
      });

      if (response.ok) {
        const resolvedToken = resolveAccessToken(data);
        if (resolvedToken) {
          setToken(resolvedToken);
        }
      }

      return { ok: response.ok, data };
    } catch (error) {
      console.error('[AuthService] login request failed', {
        url,
        message: error?.message || String(error),
      });
      throw new Error(`Sign-in error: ${error.message}`);
    }
  };

  const signUp = async (email, bahaiId, password) => {
    try {
      const { response, data } = await fetchJson(`${AUTH_BASE}/api/auth/register`, {
        method: 'POST',
        headers: jsonHeaders(false),
        body: JSON.stringify({ email, bahaiId, password }),
      });

      if (response.ok) {
        const resolvedToken = resolveAccessToken(data);
        if (resolvedToken) {
          setToken(resolvedToken);
        }
      }

      return { ok: response.ok, data };
    } catch (error) {
      throw new Error(`Sign-up error: ${error.message}`);
    }
  };

  const verify = async (bahaiId, verificationCode, password, email = null) => {
    try {
      const { response, data } = await fetchJson(`${AUTH_BASE}/api/auth/verify`, {
        method: 'POST',
        headers: jsonHeaders(false),
        body: JSON.stringify({ bahaiId, verificationCode, password }),
      });
      debugLog('verify response', redactSensitiveObject(data));

      if (response.ok) {
        const resolvedToken = resolveAccessToken(data);
        const resolvedRefreshToken = resolveRefreshToken(data);
        const resolvedUser = resolveUserFromResult(data);

        if (resolvedToken && resolvedUser) {
          await login(resolvedUser, resolvedToken, resolvedRefreshToken, email, password);
        } else if (resolvedToken) {
          setToken(resolvedToken);
        }
      }

      return { ok: response.ok, data };
    } catch (error) {
      throw new Error(`Sign-up error: ${error.message}`);
    }
  };

  const forgotPassword = async (email) => {
    try {
      const { response, data } = await fetchJson(`${AUTH_BASE}/api/auth/forgot-password`, {
        method: 'POST',
        headers: jsonHeaders(false),
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        const resolvedToken = resolveAccessToken(data);
        if (resolvedToken) {
          setToken(resolvedToken);
        }
      }

      return { ok: response.ok, data };
    } catch (error) {
      throw new Error(`Sign-up error: ${error.message}`);
    }
  };

  const forgotBahaiId = async (email) => {
    try {
      const { response, data } = await fetchJson(`${AUTH_BASE}/api/auth/forgot-bahai-id`, {
        method: 'POST',
        headers: jsonHeaders(false),
        body: JSON.stringify({ email }),
      });

      return { ok: response.ok, data };
    } catch (error) {
      throw new Error(`Forgot Bahá'í ID error: ${error.message}`);
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const { response, data } = await fetchJson(`${AUTH_BASE}/api/auth/change-password`, {
        method: 'POST',
        headers: jsonHeaders(true),
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (response.ok) {
        const resolvedToken = resolveAccessToken(data);
        if (resolvedToken) {
          setToken(resolvedToken);
        }

        return { ok: true, status: response.status, data };
      }

      return { ok: false, status: response.status, data };
    } catch (error) {
      throw new Error(`Change password error: ${error.message}`);
    }
  };

  const fetchHomeOverview = async (communityId) => {
    try {
      const { response, data } = await fetchJson(`${API_URL}/api/auth/homeOverview/${communityId}`, {
        method: 'GET',
        headers: jsonHeaders(false),
      });

      return { ok: response.ok, data };
    } catch (error) {
      throw new Error(`Sign-up error: ${error.message}`);
    }
  };

  const fetchMe = async () => {
    try {
      const { response, data } = await fetchJson(`${AUTH_BASE}/api/auth/me`, {
        method: 'GET',
        headers: jsonHeaders(true),
      });
      return { ok: response.ok, data };
    } catch (error) {
      throw new Error(`Sign-in error: ${error.message}`);
    }
  };

  const fetchPasskeyCredentials = async () => {
    try {
      return await fetchPasskeyCredentialsWithToken(token);
    } catch (error) {
      throw new Error(`Fetch passkeys error: ${error.message}`);
    }
  };

  const deletePasskeyCredential = async (credentialId) => {
    try {
      const { response, data } = await fetchJson(`${AUTH_BASE}/api/auth/passkey/credentials/${credentialId}`, {
        method: 'DELETE',
        headers: jsonHeaders(true),
      });
      return { ok: response.ok, status: response.status, data };
    } catch (error) {
      throw new Error(`Delete passkey error: ${error.message}`);
    }
  };

  const updateMe = async (updatedUser) => {
    try {
      const { response, data } = await fetchJson(`${AUTH_BASE}/api/auth/me`, {
        method: 'PUT',
        headers: jsonHeaders(true),
        body: JSON.stringify(updatedUser),
      });

      return { ok: response.ok, data };
    } catch (error) {
      throw new Error(`Update error: ${error.message}`);
    }
  };

  const getCurrentUserId = () => resolveUserIdFromToken(token);

  const checkTokenExpiration = () => {
    if (!token) {
      console.error('No token found');
      return { isValid: false, reason: 'No token found' };
    }

    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      console.error('Invalid token format');
      return { isValid: false, reason: 'Invalid token format' };
    }

    try {
      decodeToken(token);

      if (isJwtExpired(token)) {
        console.warn('Token has expired');
        return { isValid: false, reason: 'Token expired' };
      }

      return { isValid: true };
    } catch (error) {
      console.error('Error decoding token', error);
      return { isValid: false, reason: 'Error decoding token' };
    }
  };

  const createPasskey = async () => {
    const optionsUrl = `${AUTH_BASE}/api/auth/passkey/register/options`;
    const verifyUrl = `${AUTH_BASE}/api/auth/passkey/register/verify`;
    let optionsResult = null;

    try {
      optionsResult = await requestPasskeyPayload(optionsUrl, null, true, 'POST');
      if (!optionsResult.response.ok) {
        return { ok: false, data: optionsResult.data };
      }

      const challenge = optionsResult.data?.challenge;
      if (!challenge) {
        return { ok: false, data: { message: 'Invalid registration options from server.' } };
      }

      let credential = null;
      if (Platform.OS === 'ios') {
        try {
          credential = await Passkey.createPlatformKey(optionsResult.data);
        } catch (platformError) {
          const message = platformError?.message || String(platformError);
          console.warn('createPlatformKey failed:', message);
          return { ok: false, data: { message, stage: 'create_platform_failed' } };
        }
      } else {
        credential = await Passkey.create(optionsResult.data);
      }

      if (!credential) {
        return { ok: false, data: { message: 'No credentials returned from authenticator', stage: 'registration' } };
      }
      const verifyResponse = await requestPasskeyPayload(
        verifyUrl,
        { challenge, credential },
        true,
      );
      return {
        ok: verifyResponse.response.ok,
        status: verifyResponse.response.status,
        data: verifyResponse.data,
        stage: 'verify',
      };
    } catch (error) {
      console.error('Passkey create error:', error?.message || String(error));
      if (optionsResult) {
        console.error('Passkey options response:', JSON.stringify(optionsResult.data || {}));
      }
      return { ok: false, data: { message: error.message || 'Passkey registration failed' } };
    }
  };

  const authenticateWithPasskey = async () => {
    const optionsUrl = `${AUTH_BASE}/api/auth/passkey/authenticate/options`;
    const verifyUrl = `${AUTH_BASE}/api/auth/passkey/authenticate/verify`;
    let optionsResult = null;

    try {
      optionsResult = await requestPasskeyPayload(optionsUrl, null, false, 'POST');
      if (!optionsResult.response.ok) {
        return { ok: false, data: optionsResult.data };
      }

      const challenge = optionsResult.data?.challenge;
      if (!challenge) {
        return { ok: false, data: { message: 'Invalid authentication options from server.' } };
      }

      let credential = null;
      if (Platform.OS === 'ios') {
        try {
          credential = await Passkey.getPlatformKey(optionsResult.data);
        } catch (platformError) {
          const message = platformError?.message || String(platformError);
          console.warn('getPlatformKey failed:', message);
          return { ok: false, data: { message, stage: 'get_platform_failed' } };
        }
      } else {
        credential = await Passkey.get(optionsResult.data);
      }

      if (!credential) {
        return { ok: false, data: { message: 'No credentials returned from authenticator' } };
      }
      const verifyResponse = await requestPasskeyPayload(verifyUrl, { challenge, credential });

      const { response, data } = verifyResponse;
      if (response.ok) {
        const resolvedToken = resolveTokenFromResult(data);
        if (resolvedToken) {
          setToken(resolvedToken);
        }
      }

      return { ok: response.ok, data };
    } catch (error) {
      console.error('Passkey authentication error:', error?.message || String(error));
      if (optionsResult) {
        console.error('Passkey auth options response:', JSON.stringify(optionsResult.data || {}));
      }
      return { ok: false, data: { message: error.message || 'Passkey authentication failed' } };
    }
  };

  const isPasskeySupported = async () => {
    try {
      return await Passkey.isSupported();
    } catch {
      return false;
    }
  };

  const googleSignIn = async (idToken) => {
    try {
      const { response, data } = await fetchJson(`${AUTH_BASE}/api/auth/google`, {
        method: 'POST',
        headers: jsonHeaders(false),
        body: JSON.stringify({ token: idToken }),
      });

      if (response.ok) {
        const resolvedToken = resolveAccessToken(data);
        if (resolvedToken) {
          setToken(resolvedToken);
        }
        return { ok: true, data };
      }
      return { ok: false, data };
    } catch (error) {
      throw new Error(`Google sign-in error: ${error.message}`);
    }
  };

  const fetchGoogleUserInfo = () => {
    if (!token) return null;
    const decoded = decodeToken(token);
    if (!decoded) return null;
    return decoded;
  };

  const deleteAccount = async (userId, userToken) => {
    try {
      const response = await fetch(`${AUTH_BASE}/api/auth/delete-user/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
      });

      if (response.status === 204) {
        return { ok: true };
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete account');
      }

      return { ok: true };
    } catch (error) {
      console.error('Delete account error:', error);
      return { ok: false, message: error.message };
    }
  };

  return {
    token,
    signIn,
    signUp,
    verify,
    forgotPassword,
    forgotBahaiId,
    changePassword,
    fetchMe,
    fetchPasskeyCredentials,
    deletePasskeyCredential,
    updateMe,
    getCurrentUserId,
    checkTokenExpiration,
    googleSignIn,
    fetchGoogleUserInfo,
    isPasskeySupported,
    createPasskey,
    authenticateWithPasskey,
    deleteAccount,
    fetchHomeOverview,
  };
};

export const getCurrentUserId = (token) => resolveUserIdFromToken(token);

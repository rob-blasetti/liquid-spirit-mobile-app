import React, { useContext, useEffect, useRef } from 'react';
import { Buffer } from 'buffer';
import { render, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import { UserProvider } from '../contexts/UserContext.jsx';
import { UserContext, CommunityContext } from '../contexts';
import { useAuthService } from '../services/AuthService';
import { clearSessionTokens } from '../utils/authTokenStorage';

jest.mock('@react-native-async-storage/async-storage');
jest.mock('../services/ActivityService.jsx', () => ({
  fetchActivities: jest.fn(() => Promise.resolve([])),
}));
jest.mock('../services/EventService.jsx', () => ({
  fetchEvents: jest.fn(() => Promise.resolve([])),
}));
jest.mock('../services/PostService.jsx', () => ({
  fetchExploreFeed: jest.fn(() => Promise.resolve([])),
}));
jest.mock('../services/UserService.jsx', () => ({
  fetchUserById: jest.fn(() => Promise.resolve({})),
}));
jest.mock('../services/NotificationService', () => ({
  __esModule: true,
  default: {
    getAllNotifications: jest.fn(() => Promise.resolve({ data: [] })),
  },
  filterOutSelfAuthoredPostNotifications: jest.fn(notifications => notifications || []),
}));
jest.mock('../services/ChatService', () => ({
  fetchChats: jest.fn(() => Promise.resolve({ data: [] })),
}));
jest.mock('../services/SocketService', () => ({
  initializeSocket: jest.fn(() => ({
    on: jest.fn(),
    off: jest.fn(),
    disconnect: jest.fn(),
  })),
}));
jest.mock('react-native-keychain', () => ({
  ACCESSIBLE: {
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
  },
  setGenericPassword: jest.fn(() => Promise.resolve()),
  getGenericPassword: jest.fn(() => Promise.resolve(false)),
  resetGenericPassword: jest.fn(() => Promise.resolve()),
}));
jest.mock('../config', () => ({
  API_URL: 'https://api.example.com',
  AUTH_API_URL: 'https://auth.example.com',
}));
jest.mock('react-native/Libraries/AppState/AppState', () => ({
  currentState: 'active',
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
}));

const toBase64Url = value => {
  const base64 = Buffer.from(JSON.stringify(value)).toString('base64');
  return base64.replaceAll('=', '').replaceAll('+', '-').replaceAll('/', '_');
};

const buildTokenWithExp = exp => {
  const header = toBase64Url({ alg: 'RS256', typ: 'JWT' });
  const payload = toBase64Url({ exp, userId: 'user-123' });
  return `${header}.${payload}.signature`;
};

const VerifyProbe = ({ onReady }) => {
  const startedRef = useRef(false);
  const { verify } = useAuthService();
  const { storageLoaded, token, user } = useContext(UserContext);

  useEffect(() => {
    if (!storageLoaded || startedRef.current) return;
    startedRef.current = true;
    verify('123456', '654321', 'Password123', 'person@example.com');
  }, [storageLoaded, verify]);

  useEffect(() => {
    if (!token || !user) return;
    onReady({ token, user });
  }, [onReady, token, user]);

  return null;
};

describe('Auth verify session persistence', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    if (!AsyncStorage.multiGet) {
      AsyncStorage.multiGet = jest.fn(async keys => {
        const entries = [];
        for (const key of keys) {
          const value = await AsyncStorage.getItem(key);
          entries.push([key, value]);
        }
        return entries;
      });
    }
    await AsyncStorage.clear();
    await clearSessionTokens();
  });

  const renderVerifyProbe = onReady => {
    const setCommunityId = jest.fn();
    const setHomeOverview = jest.fn();

    return render(
      <CommunityContext.Provider
        value={{
          communityId: null,
          setCommunityId,
          homeOverview: null,
          setHomeOverview,
          storageLoaded: true,
        }}
      >
        <UserProvider>
          <VerifyProbe onReady={onReady} />
        </UserProvider>
      </CommunityContext.Provider>
    );
  };

  it('persists session tokens and user details after verify succeeds', async () => {
    const verifiedToken = buildTokenWithExp(Math.floor(Date.now() / 1000) + 3600);
    const verifiedUser = {
      _id: 'user-123',
      id: 'user-123',
      email: 'person@example.com',
      community: { _id: 'community-456' },
    };

    global.fetch.mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({
        accessToken: verifiedToken,
        newRefreshToken: 'refresh-789',
        user: verifiedUser,
      }),
    });

    const onReady = jest.fn();
    renderVerifyProbe(onReady);

    await waitFor(() => expect(onReady).toHaveBeenCalledWith({ token: verifiedToken, user: verifiedUser }));
    await waitFor(() =>
      expect(Keychain.setGenericPassword).toHaveBeenCalledWith(
        'session',
        JSON.stringify({ accessToken: verifiedToken, refreshToken: 'refresh-789' }),
        expect.objectContaining({ service: 'liquid-spirit-session' })
      )
    );
    await waitFor(() =>
      expect(Keychain.setGenericPassword).toHaveBeenCalledWith(
        'person@example.com',
        'Password123',
        expect.objectContaining({ accessible: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY' })
      )
    );
    await waitFor(() =>
      expect(AsyncStorage.multiSet).toHaveBeenCalledWith([
        ['user', JSON.stringify(verifiedUser)],
        ['communityId', 'community-456'],
      ])
    );
  });
});

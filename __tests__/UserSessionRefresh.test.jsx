import React, { useContext, useEffect } from 'react';
import { Buffer } from 'buffer';
import { render, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProvider } from '../contexts/UserContext.jsx';
import { UserContext, CommunityContext } from '../contexts';

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
  setGenericPassword: jest.fn(() => Promise.resolve()),
  getGenericPassword: jest.fn(() => Promise.resolve(null)),
}));
jest.mock('../config', () => ({
  API_URL: 'https://api.example.com',
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
  const header = toBase64Url({ alg: 'HS256', typ: 'JWT' });
  const payload = toBase64Url({ exp });
  return `${header}.${payload}.signature`;
};

const SessionProbe = ({ onSessionChecked }) => {
  const { ensureValidSession, storageLoaded } = useContext(UserContext);

  useEffect(() => {
    if (!storageLoaded) return;
    let cancelled = false;
    (async () => {
      const result = await ensureValidSession();
      if (!cancelled) {
        onSessionChecked(result);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [storageLoaded, ensureValidSession, onSessionChecked]);

  return null;
};

describe('User session refresh', () => {
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
  });

  it('refreshes an expired token when the session is validated', async () => {
    const expiredToken = buildTokenWithExp(Math.floor(Date.now() / 1000) - 60);
    const refreshedToken = buildTokenWithExp(Math.floor(Date.now() / 1000) + 3600);

    await AsyncStorage.multiSet([
      ['authToken', expiredToken],
      ['refreshToken', 'stored-refresh'],
    ]);

    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ accessToken: refreshedToken, newRefreshToken: 'next-refresh' }),
    });

    const onSessionChecked = jest.fn();
    const setCommunityId = jest.fn();
    const setHomeOverview = jest.fn();

    render(
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
          <SessionProbe onSessionChecked={onSessionChecked} />
        </UserProvider>
      </CommunityContext.Provider>
    );

    await waitFor(() => expect(onSessionChecked).toHaveBeenCalledWith(refreshedToken));

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.example.com/api/auth/refresh',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ refreshToken: 'stored-refresh' }),
      })
    );
    expect(AsyncStorage.multiSet).toHaveBeenCalledWith(
      expect.arrayContaining([
        ['authToken', refreshedToken],
        ['refreshToken', 'next-refresh'],
      ])
    );
  });
});

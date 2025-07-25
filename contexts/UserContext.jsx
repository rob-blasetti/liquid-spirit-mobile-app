import React, { createContext, useState, useEffect, useContext } from 'react';
import NotificationService from '../services/NotificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import { fetchActivities } from '../services/ActivityService.jsx';
import { fetchEvents } from '../services/EventService.jsx';
import { fetchExploreFeed } from '../services/PostService.jsx';
import { fetchUserById } from '../services/UserService.jsx';
import { parseJwt } from '../utils/parseJwt';
import { API_URL } from '../config';
import { CommunityContext } from './CommunityContext';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const { setCommunityId } = useContext(CommunityContext);
  const [userActivities, setUserActivities] = useState(null);
  const [userEvents, setUserEvents] = useState(null);
  const [userPosts, setUserPosts] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshToken, setRefreshToken] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userNotifications, setUserNotifications] = useState(null);
  const [storageLoaded, setStorageLoaded] = useState(false);
  // Detailed user info (including certifications) fetched on startup
  const [userDetails, setUserDetails] = useState(null);

  useEffect(() => {
    const loadCachedData = async () => {
      try {
        const keys = [
          'authToken',
          'refreshToken',
          'user',
          'userActivities',
          'userEvents',
          'userPosts',
          'userDetails',
        ];
        const stores = await AsyncStorage.multiGet(keys);
        const map = Object.fromEntries(stores);

        if (map.authToken) setToken(map.authToken);
        if (map.refreshToken) setRefreshToken(map.refreshToken);
        if (map.user) setUser(JSON.parse(map.user));

        if (map.userActivities)
          setUserActivities(JSON.parse(map.userActivities));
        if (map.userEvents) setUserEvents(JSON.parse(map.userEvents));
        if (map.userPosts) setUserPosts(JSON.parse(map.userPosts));
        if (map.userDetails) setUserDetails(JSON.parse(map.userDetails));
      } catch (error) {
        console.error('Error loading cached data:', error);
      }
    };

    loadCachedData().finally(() => {
      setStorageLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!token) return;
    
    if (isTokenExpired(token)) {
      refreshSession();
      return;
    }

    const loadUserData = async () => {
      try {
        setIsLoading(true);

        const [posts, activities, events] = await Promise.all([          
          fetchExploreFeed(token),
          fetchActivities(token),
          fetchEvents(token),
        ]);

        setUserPosts(posts);
        setUserActivities(activities);
        setUserEvents(events);

        await AsyncStorage.setItem('userActivities', JSON.stringify(activities));
        await AsyncStorage.setItem('userEvents', JSON.stringify(events));
        await AsyncStorage.setItem('userPosts', JSON.stringify(posts));

      } catch (error) {
        console.error("Error loading user data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [token]);

  // Fetch full user details (including certifications) and sync profile picture on startup
  useEffect(() => {
    if (!token || !user?.id) return;
    const fetchDetails = async () => {
      try {
        const data = await fetchUserById(user.id, token);
        setUserDetails(data);
        // Persist detailed user to storage
        await AsyncStorage.setItem('userDetails', JSON.stringify(data));
        // Sync main user context with profile picture from detailed data
        if (data.profilePicture) {
          setUser(prev => ({ ...prev, profilePicture: data.profilePicture }));
        }
      } catch (error) {
        console.error('Failed to fetch user details:', error);
      }
    };
    fetchDetails();
  }, [token, user?.id]);

  const login = async (userData, authToken, refreshToken, email, password) => {
    try {
      setUser(userData);
      setToken(authToken);
      setRefreshToken(refreshToken);
      setCommunityId(userData.community?._id);
  
      await AsyncStorage.multiSet([
        ['authToken', authToken],
        ['refreshToken', refreshToken],
        ['user', JSON.stringify(userData)],
        ['communityId', userData.community?._id || ''],
      ]);
  
      if (email && password) {
        // Store credentials securely without prompting biometric on save (will prompt on retrieval)
        await Keychain.setGenericPassword(email, password, {
          accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        });
        console.log('Credentials securely stored.');
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      setToken(null);
      setCommunityId(null);
      setUserActivities(null);
      setUserEvents(null);
      setUserPosts(null);

      await AsyncStorage.multiRemove([
        'authToken',
        'user',
        'communityId',
        'userActivities',
        'userEvents',
        'userPosts',
        'userDetails',
      ]);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  function isTokenExpired(token) {
    try {
      const { exp } = parseJwt(token);
  
      // If 'exp' doesn't exist or decoding fails, treat token as invalid
      if (!exp) return true;
  
      // Check if the current time is past the token's expiration time
      return Date.now() >= exp * 1000;
    } catch (error) {
      console.error('Error decoding JWT:', error);
      return true; // Consider invalid if decode fails
    }
  }

  const refreshSession = async () => {
    const storedRefreshToken = await AsyncStorage.getItem('refreshToken');
    console.log("Retrieved refresh token from storage:", storedRefreshToken);
    if (!storedRefreshToken) {
      console.error('No stored refresh token.');
      logout();
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: storedRefreshToken }),
      });
  
      // parse the JSON body once
      const data = await response.json();
      
      if (!response.ok) {
        console.warn("Invalid refresh token, attempting re-login with stored credentials...");
        await AsyncStorage.removeItem('refreshToken');
        // Attempt to re-authenticate using stored credentials
        try {
          await biometricLogin();
        } catch (err) {
          console.error('Re-login failed:', err);
          logout();
        }
        return;
      }
  
      // Extract tokens
      const { accessToken, newRefreshToken } = data;
      
      await AsyncStorage.multiSet([
        ['authToken', accessToken],
        ['refreshToken', newRefreshToken || ''],
      ]);

      setToken(accessToken);
      setRefreshToken(newRefreshToken);
    } catch (error) {
      // Refresh token failed, force logout
      console.error('Refresh error:', error);
      logout();
    }
  };
  // Load notifications on token change
  useEffect(() => {
    if (!token) return;
    // if token expired, attempt to refresh and defer loading notifications
    if (isTokenExpired(token)) {
      refreshSession();
      return;
    }
    const loadNotifications = async () => {
      try {
        const resp = await NotificationService.getAllNotifications(token, { limit: 10, offset: 0 });
        const notifs = resp.data || [];
        setUserNotifications(notifs);
        const unread = notifs.filter(n => !n.isRead).length;
        setUnreadCount(unread);
      } catch (error) {
        console.error('Error loading notifications:', error);
      }
    };
    loadNotifications();
  }, [token]);

  const biometricLogin = async () => {
    try {
      const credentials = await Keychain.getGenericPassword({
        authenticationPrompt: {
          title: 'Login to Liquid Spirit',
          subtitle: 'Authenticate using Face ID / Touch ID',
        },
      });
  
      if (credentials) {
        const response = await fetch(`${API_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: credentials.username,
            password: credentials.password,
          }),
        });
  
        const data = await response.json();
  
        if (response.ok) {
          await login(
            data.user,
            data.token,
            data.refreshToken,
            credentials.username,
            credentials.password
          );
          console.log('Biometric login successful!');
        } else {
          console.error('Login failed:', data.message);
        }
      } else {
        console.warn('No credentials found for biometric login.');
      }
    } catch (error) {
      console.error('Biometric login exception:', error);
    }
  };  

  return (
    <UserContext.Provider 
      value={{
        user,
        // Detailed user info including certifications
        userDetails,
        setUserDetails,
        setUser,
        userActivities,
        setUserActivities,
        userEvents,
        setUserEvents,
        userPosts,
        setUserPosts,
        token,
        setToken,
        unreadCount,
        setUnreadCount,
        userNotifications,
        setUserNotifications,
        login,
        logout,
        isLoggedIn: !!token,
        biometricLogin,
        isTokenExpired,
        refreshSession
        ,storageLoaded
      }}>
      {children}
    </UserContext.Provider>
  );
};

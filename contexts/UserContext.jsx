import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchActivities } from '../services/ActivityService.jsx';
import { fetchEvents } from '../services/EventService.jsx';
import { fetchExploreFeed } from '../services/PostService.jsx';
import { parseJwt } from '../utils/parseJwt';
import { API_URL } from '../config';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [communityId, setCommunityId] = useState(null);
  const [userActivities, setUserActivities] = useState(null);
  const [userEvents, setUserEvents] = useState(null);
  const [userPosts, setUserPosts] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshToken, setRefreshToken] = useState(null);

  useEffect(() => {
    const loadCachedData = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('authToken');
        const storedRefreshToken = await AsyncStorage.getItem('refreshToken');
        const storedUser = await AsyncStorage.getItem('user');
        const storedCommunityId = await AsyncStorage.getItem('communityId');

        if (storedToken) setToken(storedToken);
        if (storedRefreshToken) setRefreshToken(storedRefreshToken);
        if (storedUser) setUser(JSON.parse(storedUser));
        if (storedCommunityId) setCommunityId(storedCommunityId); 

        const cachedActivities = await AsyncStorage.getItem('userActivities');
        const cachedEvents = await AsyncStorage.getItem('userEvents');
        const cachedPosts = await AsyncStorage.getItem('userPosts');

        if (cachedActivities) setUserActivities(JSON.parse(cachedActivities));
        if (cachedEvents) setUserEvents(JSON.parse(cachedEvents));
        if (cachedPosts) setUserPosts(JSON.parse(cachedPosts));

      } catch (error) {
        console.error("Error loading cached data:", error);
      }
    };

    loadCachedData();
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
  }, [communityId, token]);

  const login = async (userData, authToken, refreshToken) => {
    try {
      setUser(userData);
      setToken(authToken);
      setRefreshToken(refreshToken);
      setCommunityId(userData.community?._id);

      await AsyncStorage.setItem('authToken', authToken);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      await AsyncStorage.setItem('communityId', userData?.community?._id || '');
      await AsyncStorage.setItem('refreshToken', refreshToken|| '');

    } catch (error) {
      console.error("Login error:", error);
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

      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('communityId');
      await AsyncStorage.removeItem('userActivities');
      await AsyncStorage.removeItem('userEvents');
      await AsyncStorage.removeItem('userPosts');
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

  const isLoggedIn = () => !!token;

  const refreshSession = async () => {
    const storedRefreshToken = await AsyncStorage.getItem('refreshToken');
    if (!storedRefreshToken) {
      console.error('No stored refresh token.');
      logout();
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
  
      // parse the JSON body once
      const data = await response.json();
      
      if (!response.ok) {
        // Here 'data.message' might be 'No refresh token provided' or something else
        throw new Error(data.message || 'Refresh token invalid');
      }
  
      // Extract tokens
      const { accessToken, newRefreshToken } = data;
      
      await AsyncStorage.setItem('authToken', accessToken);
      await AsyncStorage.setItem('refreshToken', newRefreshToken || '');

      setToken(accessToken);
      setRefreshToken(newRefreshToken);
    } catch (error) {
      // Refresh token failed, force logout
      console.error('Refresh error:', error);
      logout();
    }
  };
  

  return (
    <UserContext.Provider 
      value={{ 
        user, 
        setUser, 
        userActivities, 
        setUserActivities, 
        userEvents,
        setUserEvents, 
        userPosts, 
        setUserPosts, 
        token, 
        setToken, 
        communityId, 
        setCommunityId,
        isLoggedIn,
        login,
        logout,
        isTokenExpired,
        refreshSession
      }}>
      {children}
    </UserContext.Provider>
  );
};

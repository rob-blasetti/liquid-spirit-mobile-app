import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchActivities } from '../services/ActivityService.jsx';
import { fetchEvents } from '../services/EventService.jsx';
import { fetchExploreFeed } from '../services/PostService.jsx';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [communityId, setCommunityId] = useState(null);
  const [userActivities, setUserActivities] = useState(null);
  const [userEvents, setUserEvents] = useState(null);
  const [userPosts, setUserPosts] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCachedData = async () => {
      try {
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
        setUserEvents(events.data);

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
  }, [communityId, token])

  const isLoggedIn = () => {
    return !!token; // Returns true if token exists, otherwise false
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
        isLoggedIn
      }}>
      {children}
    </UserContext.Provider>
  );
};

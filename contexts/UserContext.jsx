import React, { createContext, useState, useEffect } from 'react';
import { fetchActivities } from '../services/ActivityService.jsx';
import { fetchEvents } from '../services/EventService.jsx';
import { fetchCommunityFeed } from '../services/PostService.jsx';

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
    if (!token) return;

    const loadUserData = async () => {
      try {
        setIsLoading(true);

        const [posts, activities, events] = await Promise.all([
          fetchCommunityFeed(communityId, token),
          fetchActivities(token),
          fetchEvents(token),
        ]);

        setUserPosts(posts);
        setUserActivities(activities);
        setUserEvents(events.data);
      } catch (error) {
        console.error("Error loading user data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [communityId, token])

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
        setCommunityId
      }}>
      {children}
    </UserContext.Provider>
  );
};

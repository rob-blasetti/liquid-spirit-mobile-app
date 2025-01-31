import React, { createContext, useState } from 'react';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [communityId, setCommunityId] = useState(null);
  const [userActivities, setUserActivities] = useState(null);
  const [userEvents, setUserEvents] = useState(null);
  const [userPosts, setUserPosts] = useState(null);

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

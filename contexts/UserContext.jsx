import React, { createContext, useState } from 'react';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [communityId, setCommunityId] = useState(null);

  return (
    <UserContext.Provider value={{ user, setUser, token, setToken, communityId, setCommunityId }}>
      {children}
    </UserContext.Provider>
  );
};

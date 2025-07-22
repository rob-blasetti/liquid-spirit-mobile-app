import React, {createContext, useContext} from 'react';
import usePersistedState from '../hooks/usePersistedState';

const UserProfileContext = createContext();

export const UserProfileProvider = ({children}) => {
  const [userBody, setUserBody] = usePersistedState('user_profile', {});
  const [family, setFamily] = usePersistedState('user_family', []);

  const updateProfile = data => setUserBody(data);
  const updateFamily = members => setFamily(members);

  return (
    <UserProfileContext.Provider value={{userBody, family, updateProfile, updateFamily}}>
      {children}
    </UserProfileContext.Provider>
  );
};

export const useUserProfileContext = () => useContext(UserProfileContext);

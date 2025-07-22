import React, {createContext, useContext} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import usePersistedState from '../hooks/usePersistedState';

const AuthContext = createContext();

export const AuthProvider = ({children}) => {
  const [user, setUser] = usePersistedState('auth_user', null);
  const [loading, setLoading] = usePersistedState('auth_loading', false);

  const signOut = async () => {
    try {
      await AsyncStorage.clear();
    } catch (e) {
      console.error('Error clearing storage:', e);
    } finally {
      setUser(null);
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{user, loading, setUser, setLoading, signOut}}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);

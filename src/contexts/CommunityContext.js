import React, {createContext, useContext} from 'react';
import usePersistedState from '../hooks/usePersistedState';

const CommunityContext = createContext();

export const CommunityProvider = ({children}) => {
  const [community, setCommunity] = usePersistedState('community', null);
  const [lsa, setLsa] = usePersistedState('lsa', null);
  const [stats, setStats] = usePersistedState('stats', null);

  return (
    <CommunityContext.Provider value={{community, lsa, stats, setCommunity, setLsa, setStats}}>
      {children}
    </CommunityContext.Provider>
  );
};

export const useCommunityContext = () => useContext(CommunityContext);

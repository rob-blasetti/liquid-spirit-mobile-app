import React, {createContext, useContext} from 'react';
import usePersistedState from '../hooks/usePersistedState';

const NewsContext = createContext();

export const NewsProvider = ({children}) => {
  const [newsFeed, setNewsFeed] = usePersistedState('news_feed', []);

  const fetchNewsFeed = async () => {
    // TODO: API call
    setNewsFeed([]);
  };

  return (
    <NewsContext.Provider value={{newsFeed, setNewsFeed, fetchNewsFeed}}>
      {children}
    </NewsContext.Provider>
  );
};

export const useNewsContext = () => useContext(NewsContext);

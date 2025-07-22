import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config';

export const CommunityContext = createContext();

export const CommunityProvider = ({ children }) => {
  const [communityId, setCommunityId] = useState(null);
  const [homeOverview, setHomeOverview] = useState(null);
  const [storageLoaded, setStorageLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [idPair, overviewPair] = await AsyncStorage.multiGet([
          'communityId',
          'homeOverview',
        ]);
        if (idPair[1]) setCommunityId(idPair[1]);
        if (overviewPair[1]) setHomeOverview(JSON.parse(overviewPair[1]));
      } catch (err) {
        console.error('Failed to load community cache:', err);
      } finally {
        setStorageLoaded(true);
      }
    })();
  }, []);

  const fetchHomeOverview = async (id) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/homeOverview/${id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      return { ok: response.ok, data };
    } catch (error) {
      console.error('Home overview fetch error:', error);
      return { ok: false };
    }
  };

  useEffect(() => {
    if (!communityId) return;
    (async () => {
      try {
        const result = await fetchHomeOverview(communityId);
        if (result.ok) {
          setHomeOverview(result.data);
          await AsyncStorage.setItem('homeOverview', JSON.stringify(result.data));
        } else {
          console.warn('Failed to fetch home overview');
        }
      } catch (err) {
        console.error('Error fetching home overview:', err);
      }
    })();
  }, [communityId]);

  return (
    <CommunityContext.Provider value={{
      communityId,
      setCommunityId,
      homeOverview,
      setHomeOverview,
      storageLoaded,
    }}>
      {children}
    </CommunityContext.Provider>
  );
};

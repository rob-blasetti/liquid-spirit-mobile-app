import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { CommunityContext } from './CommunityContext';
import { UserContext } from './UserContext';
import { fetchVenues as apiFetchVenues } from '../services/VenueService';

const defaultVenuesContext = {
  venues: [],
  loading: false,
  error: null,
  reload: async () => {},
  upsertVenue: () => null,
  storageLoaded: false,
};

export const VenuesContext = createContext(defaultVenuesContext);

const buildCacheKey = (communityId) => `venues:${communityId}`;

export const VenuesProvider = ({ children }) => {
  const { communityId } = useContext(CommunityContext);
  const { token } = useContext(UserContext);
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [storageLoaded, setStorageLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadCachedVenues = async () => {
      if (!communityId) {
        setVenues([]);
        setStorageLoaded(true);
        return;
      }

      setStorageLoaded(false);
      try {
        const cached = await AsyncStorage.getItem(buildCacheKey(communityId));
        if (!cancelled) {
          setVenues(cached ? JSON.parse(cached) : []);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load cached venues:', err);
          setVenues([]);
        }
      } finally {
        if (!cancelled) {
          setStorageLoaded(true);
        }
      }
    };

    loadCachedVenues();
    return () => {
      cancelled = true;
    };
  }, [communityId]);

  const loadVenues = useCallback(async (signal) => {
    if (!communityId || !token) {
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await apiFetchVenues(communityId, token, { signal });
      const list = Array.isArray(response?.venues) ? response.venues : (Array.isArray(response) ? response : []);
      setVenues(list);
      await AsyncStorage.setItem(buildCacheKey(communityId), JSON.stringify(list));
    } catch (err) {
      if (err?.name === 'AbortError') return;
      setError(err?.message || 'Failed to load venues.');
    } finally {
      setLoading(false);
    }
  }, [communityId, token]);

  useEffect(() => {
    if (!communityId || !token) {
      setVenues([]);
      setLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    loadVenues(controller.signal);
    return () => controller.abort();
  }, [communityId, token, loadVenues]);

  const upsertVenue = useCallback((nextVenue) => {
    if (!nextVenue) return nextVenue;
    const id = nextVenue._id || nextVenue.id;
    if (!id) return nextVenue;

    setVenues((prev) => {
      const next = [{ ...nextVenue }, ...prev.filter((venue) => String(venue._id || venue.id) !== String(id))];
      if (communityId) {
        AsyncStorage.setItem(buildCacheKey(communityId), JSON.stringify(next)).catch(() => {});
      }
      return next;
    });

    return nextVenue;
  }, [communityId]);

  const value = useMemo(
    () => ({
      venues,
      loading,
      error,
      reload: loadVenues,
      upsertVenue,
      storageLoaded,
    }),
    [venues, loading, error, loadVenues, upsertVenue, storageLoaded],
  );

  return (
    <VenuesContext.Provider value={value}>
      {children}
    </VenuesContext.Provider>
  );
};

import { useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserContext } from '../contexts';
import { fetchExploreFeed, useAuthService } from '../services';

/**
 * Custom hook to initialize the app: session check, token refresh,
 * initial explore feed, home overview, and splash state.
 */
export const useAppInitialization = () => {
  const [appIsReady, setAppIsReady] = useState(false);
  const [initialPosts, setInitialPosts] = useState([]);
  const [homeOverview, setHomeOverview] = useState([]);
  const [homeOverviewLoaded, setHomeOverviewLoaded] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [showSplash, setShowSplash] = useState(true);

  const { biometricLogin, isLoggedIn, communityId, storageLoaded,
          token, isTokenExpired, refreshSession } = useContext(UserContext);
  const { fetchHomeOverview } = useAuthService();

  // Load cached posts and overview for immediate display
  useEffect(() => {
    (async () => {
      try {
        const cachedPosts = await AsyncStorage.getItem('initialExploreFeed');
        if (cachedPosts) {
          setInitialPosts(JSON.parse(cachedPosts));
        }
        const cachedOverview = await AsyncStorage.getItem('homeOverview');
        if (cachedOverview) {
          setHomeOverview(JSON.parse(cachedOverview));
        }
      } catch (err) {
        console.warn('Failed to load cached data:', err);
      }
    })();
  }, []);

  // Core initialization: biometric login, token refresh, and initial explore feed
  useEffect(() => {
    const initialize = async () => {
      if (!storageLoaded) return;

      if (checkingSession) {
        try {
          if (!isLoggedIn) {
            await biometricLogin();
          }
        } catch (err) {
          console.error('Biometric login failed:', err);
        } finally {
          setCheckingSession(false);
          // if user is not logged in, mark ready
          if (!isLoggedIn) setAppIsReady(true);
        }
        return;
      }

      if (!appIsReady) {
        // ensure token is valid, else refresh
        if (!token || isTokenExpired(token)) {
          try {
            await refreshSession();
          } catch (err) {
            console.error('Token refresh failed during initial load:', err);
          }
          return;
        }
        // mark initial load ready; explore feed will be fetched in background
        setAppIsReady(true);
        return;
      }
    };

    initialize();
  }, [
    storageLoaded,
    checkingSession,
    appIsReady,
    isLoggedIn,
    token,
    biometricLogin,
    isTokenExpired,
    refreshSession,
  ]);

  // Fetch home overview independently
  useEffect(() => {
    if (!communityId) return;
    setHomeOverviewLoaded(false);
    (async () => {
      try {
        const result = await fetchHomeOverview(communityId);
        if (result.ok) {
          setHomeOverview(result.data);
          await AsyncStorage.setItem('homeOverview', JSON.stringify(result.data));
        } else {
          console.warn('Failed to fetch home overview');
        }
      } catch (error) {
        console.error('Error fetching home overview:', error);
      } finally {
        setHomeOverviewLoaded(true);
      }
    })();
  }, [communityId, fetchHomeOverview]);

  // Hide splash once minimal data is ready
  useEffect(() => {
    if (!checkingSession && storageLoaded) {
      setShowSplash(false);
    }
  }, [checkingSession, storageLoaded]);

  // Background fetch explore feed after home is displayed
  useEffect(() => {
    if (showSplash) return;
    if (!token || isTokenExpired(token)) return;
    (async () => {
      try {
        const fetched = await fetchExploreFeed(token);
        setInitialPosts(fetched);
        await AsyncStorage.setItem('initialExploreFeed', JSON.stringify(fetched));
      } catch (error) {
        console.error('Error fetching explore feed in background:', error);
      }
    })();
  }, [showSplash, token, isTokenExpired, fetchExploreFeed]);

  return { initialPosts, homeOverview, showSplash };};
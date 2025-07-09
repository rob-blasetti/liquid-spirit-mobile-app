import { useState, useEffect, useContext } from 'react';
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

  // Attempt biometric login once storage is loaded
  useEffect(() => {
    if (!storageLoaded) return;
    const attemptBiometricLogin = async () => {
      if (!isLoggedIn) await biometricLogin();
      setCheckingSession(false);
    };
    attemptBiometricLogin();
  }, [storageLoaded]);

  // Prepare app: refresh token and fetch initial explore feed
  useEffect(() => {
    if (!storageLoaded || checkingSession) return;
    const prepareApp = async () => {
      if (!token || isTokenExpired(token)) {
        try { await refreshSession(); } catch (err) {
          console.error('Token refresh failed during initial load:', err);
        }
        return;
      }
      try {
        const fetched = await fetchExploreFeed(token);
        setInitialPosts(fetched);
        // slight delay for splash
        await new Promise(res => setTimeout(res, 200));
      } catch (error) {
        console.error('Error loading initial explore feed:', error);
      } finally {
        setAppIsReady(true);
      }
    };
    prepareApp();
  }, [storageLoaded, checkingSession, token]);

  // Fetch home overview when communityId changes
  useEffect(() => {
    const loadHomeOverview = async () => {
      if (!communityId) return;
      setHomeOverviewLoaded(false);
      try {
        const result = await fetchHomeOverview(communityId);
        if (result.ok) setHomeOverview(result.data);
        else console.warn('Failed to fetch home overview');
      } catch (error) {
        console.error('Error fetching home overview:', error);
      } finally {
        setHomeOverviewLoaded(true);
      }
    };
    loadHomeOverview();
  }, [communityId]);

  // Hide splash when ready
  useEffect(() => {
    if (
      appIsReady && !checkingSession &&
      (!isLoggedIn || (communityId && homeOverviewLoaded))
    ) {
      setShowSplash(false);
    }
  }, [appIsReady, checkingSession, isLoggedIn, communityId, homeOverviewLoaded]);

  return { initialPosts, homeOverview, showSplash };
};
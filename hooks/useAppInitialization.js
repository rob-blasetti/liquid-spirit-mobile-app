import { useState, useEffect, useContext, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserContext, CommunityContext } from '../contexts';
import { fetchExploreFeed } from '../services';
import useMountEffect from './useMountEffect';

/**
 * Custom hook to initialize the app: session check, token refresh,
 * initial explore feed, home overview, and splash state.
 */
export const useAppInitialization = () => {
  const [appIsReady, setAppIsReady] = useState(false);
  const [initialPosts, setInitialPosts] = useState([]);
  const [checkingSession, setCheckingSession] = useState(true);

  const { biometricLogin, isLoggedIn, storageLoaded, token, ensureValidSession } = useContext(UserContext);
  const { homeOverview } = useContext(CommunityContext);
  const showSplash = checkingSession || !storageLoaded;
  const biometricLoginRef = useRef(biometricLogin);
  const ensureValidSessionRef = useRef(ensureValidSession);
  const backgroundFeedTokenRef = useRef(null);

  biometricLoginRef.current = biometricLogin;
  ensureValidSessionRef.current = ensureValidSession;

  // Load cached posts for immediate display
  useMountEffect(() => {
    (async () => {
      try {
        const [postsPair] = await AsyncStorage.multiGet([
          'initialExploreFeed',
        ]);
        if (postsPair[1]) setInitialPosts(JSON.parse(postsPair[1]));
      } catch (err) {
        console.warn('Failed to load cached data:', err);
      }
    })();
  });

  // Core initialization: biometric login, token refresh, and initial explore feed
  useEffect(() => {
    const initialize = async () => {
      if (!storageLoaded) return;

      if (checkingSession) {
        try {
          if (!isLoggedIn) {
            await biometricLoginRef.current();
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
        try {
          const validToken = await ensureValidSessionRef.current();
          if (!validToken) {
            return;
          }
        } catch (err) {
          console.error('Token refresh failed during initial load:', err);
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
  ]);

  // Background fetch explore feed after home is displayed
  useEffect(() => {
    if (!appIsReady) return;
    if (!token) return;
    if (backgroundFeedTokenRef.current === token) return;

    backgroundFeedTokenRef.current = token;

    (async () => {
      try {
        const validToken = await ensureValidSessionRef.current();
        if (!validToken) return;
        const fetched = await fetchExploreFeed(validToken);
        setInitialPosts(fetched);
        await AsyncStorage.setItem('initialExploreFeed', JSON.stringify(fetched));
      } catch (error) {
        backgroundFeedTokenRef.current = null;
        console.error('Error fetching explore feed in background:', error);
      }
    })();
  }, [appIsReady, token]);

  return { initialPosts, homeOverview, showSplash };
};

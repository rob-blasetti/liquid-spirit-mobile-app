import { useState, useEffect, useMemo, useRef, useCallback, useContext } from 'react';
import { Alert, BackHandler, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fetchActivityDetails, requestParticipation, requestFacilitator } from '../../../../services/ActivityService';
import { shareContent } from '../../../../utils/shareContent';
import { resolveSessionDate } from '../../../../utils/activityDate';
import { UserContext } from '../../../../contexts/UserContext';

const normalizeString = (value) => (typeof value === 'string' ? value.trim() : '');

const formatAddress = (address) => {
  if (!address || typeof address !== 'object') return '';
  const parts = [
    address.streetAddress,
    address.suburb,
    address.city,
    address.state,
    address.postalCode,
    address.country,
  ];
  return parts
    .map(part => (typeof part === 'string' ? part.trim() : ''))
    .filter(part => part.length > 0)
    .join(', ');
};

const coerceCoordinates = (value) => {
  const makePoint = (lat, lng) => {
    const latitude = Number(lat);
    const longitude = Number(lng);
    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      return { latitude, longitude };
    }
    return null;
  };

  if (!value) return null;
  if (Array.isArray(value) && value.length >= 2) {
    const [lng, lat] = value;
    return makePoint(lat, lng);
  }
  if (typeof value === 'object') {
    if ('latitude' in value || 'longitude' in value) {
      return makePoint(value.latitude ?? value.lat, value.longitude ?? value.lng);
    }
    if ('lat' in value || 'lng' in value) {
      return makePoint(value.lat, value.lng);
    }
    if (Array.isArray(value.coordinates) && value.coordinates.length >= 2) {
      const [lng, lat] = value.coordinates;
      return makePoint(lat, lng);
    }
  }
  return null;
};

const useActivityDetail = ({ route }) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user, token, isTokenExpired, refreshSession, storageLoaded } = useContext(UserContext);
  const {
    activityId,
    activity: activityPreload,
    initialSessionId,
    prefilledParticipants = [],
    prefilledFacilitators = [],
  } = route.params || {};

  const [activity, setActivity] = useState(activityPreload || null);
  const [loading, setLoading] = useState(!activityPreload);
  const [error, setError] = useState(null);
  const [errorStatus, setErrorStatus] = useState(null);
  const [redirected, setRedirected] = useState(false);
  const [detailsLoaded, setDetailsLoaded] = useState(false);
  const [optimisticFacilitatorRequest, setOptimisticFacilitatorRequest] = useState(false);
  const [optimisticParticipantRequest, setOptimisticParticipantRequest] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState('');
  const [chat, setChat] = useState(null);
  const [mapAddress, setMapAddress] = useState(null);
  const [mapRegion, setMapRegion] = useState(null);
  const prefillParamsSetRef = useRef(false);
  const didRefresh = useRef(false);
  const chatImageRef = useRef(null);
  const chatTitleRef = useRef(null);

  const normalizedInitialSessionId = useMemo(() => normalizeString(initialSessionId), [initialSessionId]);
  const nextSession = useMemo(() => (Array.isArray(activity?.sessions) ? activity.sessions[0] : null), [activity]);
  const mapVenue = useMemo(() => {
    if (nextSession?.primaryVenue) return nextSession.primaryVenue;
    if (Array.isArray(nextSession?.venues) && nextSession.venues.length) return nextSession.venues[0];
    if (Array.isArray(activity?.venues) && activity.venues.length) return activity.venues[0];
    return null;
  }, [nextSession, activity]);

  useEffect(() => {
    const navSub = navigation.addListener('beforeRemove', () => {
      if (Platform.OS === 'android') BackHandler.exitApp();
    });
    return navSub;
  }, [navigation]);

  useEffect(() => {
    const id = activity?._id || activityId;
    if (!id || !token) return;
    const run = async () => {
      setLoading(true);
      try {
        const data = await fetchActivityDetails(id, token);
        if (!data) {
          setError('Activity not found');
          setErrorStatus(404);
        } else {
          setActivity(data);
          setError(null);
          setErrorStatus(null);
        }
      } catch (err) {
        const status = err?.status || err?.response?.status;
        setError(err?.message || 'Failed to load activity details');
        setErrorStatus(status || 'unknown');
      } finally {
        setLoading(false);
        setDetailsLoaded(true);
      }
    };
    run();
  }, [activityId, activity?._id, token]);

  useEffect(() => {
    if (!activity) return;
    if (nextSession?.address) {
      setMapAddress(formatAddress(nextSession.address));
      const coords = coerceCoordinates(nextSession.address?.coordinates) || coerceCoordinates(nextSession.address);
      if (coords) {
        setMapRegion({
          latitude: coords.latitude,
          longitude: coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }
      return;
    }
    if (mapVenue?.address) {
      setMapAddress(formatAddress(mapVenue.address));
      const coords = coerceCoordinates(mapVenue.address?.coordinates) || coerceCoordinates(mapVenue.address);
      if (coords) {
        setMapRegion({
          latitude: coords.latitude,
          longitude: coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }
      return;
    }
    if (activity.address) {
      setMapAddress(formatAddress(activity.address));
      const coords = coerceCoordinates(activity.address?.coordinates) || coerceCoordinates(activity.address);
      if (coords) {
        setMapRegion({
          latitude: coords.latitude,
          longitude: coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }
    }
  }, [activity, mapVenue, nextSession]);

  const handleShare = useCallback(() => {
    const id = activity?._id || activityId;
    if (!id) return;
    const url = `https://www.liquidspirit.org/activities/${id}`;
    const title = activity?.title || 'Liquid Spirit Activity';
    const message = `Check out this activity on Liquid Spirit 👇\n${url}`;
    shareContent({
      url,
      message,
      title,
      alertMessage: 'Something went wrong while trying to share the activity.',
    });
  }, [activity, activityId]);

  const handleFacilitatorRequest = useCallback(async (userId) => {
    setOptimisticFacilitatorRequest(true);
    try {
      await requestFacilitator(activity._id, userId, token || '');
      const updated = await fetchActivityDetails(activity._id, token || '');
      setActivity(updated);
    } catch (err) {
      const msg = err.message || 'Failed to send facilitator request';
      if (msg.toLowerCase().includes('already')) {
        setOptimisticFacilitatorRequest(true);
        try {
          const updated = await fetchActivityDetails(activity._id, token || '');
          setActivity(updated);
        } catch (_) {}
      } else {
        setOptimisticFacilitatorRequest(false);
      }
      Alert.alert('Request Error', msg);
    }
  }, [activity?._id, token]);

  const handleParticipantRequest = useCallback(async (userId) => {
    setOptimisticParticipantRequest(true);
    try {
      await requestParticipation(activity._id, userId, token || '');
      const updated = await fetchActivityDetails(activity._id, token || '');
      setActivity(updated);
    } catch (err) {
      const msg = err.message || 'Failed to send participation request';
      if (msg.toLowerCase().includes('already')) {
        setOptimisticParticipantRequest(true);
        try {
          const updated = await fetchActivityDetails(activity._id, token || '');
          setActivity(updated);
        } catch (_) {}
      } else {
        setOptimisticParticipantRequest(false);
      }
      Alert.alert('Request Error', msg);
    }
  }, [activity?._id, token]);

  const upcomingSessions = useMemo(() => {
    if (!Array.isArray(activity?.sessions)) return [];
    const now = new Date();
    return activity.sessions
      .filter(Boolean)
      .filter(session => ['Scheduled', 'Confirmed'].includes(session?.status))
      .map(session => {
        const dateObj = resolveSessionDate(session, activity);
        return { session, dateObj };
      })
      .filter(({ dateObj }) => dateObj instanceof Date && !isNaN(dateObj) && dateObj >= now)
      .map(({ session, dateObj }) => ({
        ...session,
        dateObj,
      }))
      .sort((a, b) => a.dateObj - b.dateObj);
  }, [activity]);

  return {
    activity,
    setActivity,
    activityPreload,
    activityId,
    loading,
    error,
    errorStatus,
    mapRegion,
    mapAddress,
    upcomingSessions,
    handleShare,
    handleFacilitatorRequest,
    handleParticipantRequest,
    optimisticFacilitatorRequest,
    optimisticParticipantRequest,
    detailsLoaded,
    insets,
    user,
    token,
    nextSession,
    mapVenue,
  };
};

export default useActivityDetail;

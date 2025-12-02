import { useState, useEffect, useCallback, useContext } from 'react';
import { Alert, BackHandler, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fetchActivityDetails, requestParticipation, requestFacilitator } from '../../../../services/ActivityService';
import { shareContent } from '../../../../utils/shareContent';
import { UserContext } from '../../../../contexts/UserContext';
import useActivitySessions from './useActivitySessions';
import useActivityLocation from './useActivityLocation';
import { mapActivityDetail } from '../utils/activityMapper';

const useActivityDetail = ({ route }) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user, token } = useContext(UserContext);
  const {
    activityId,
    activity: activityPreload,
    initialSessionId,
  } = route.params || {};

  const mappedPreload = mapActivityDetail(activityPreload) || null;

  const [activity, setActivity] = useState(mappedPreload);
  const [loading, setLoading] = useState(!mappedPreload);
  const [error, setError] = useState(null);
  const [errorStatus, setErrorStatus] = useState(null);
  const [detailsLoaded, setDetailsLoaded] = useState(false);
  const [optimisticFacilitatorRequest, setOptimisticFacilitatorRequest] = useState(false);
  const [optimisticParticipantRequest, setOptimisticParticipantRequest] = useState(false);
  const { orderedUpcomingSessions: upcomingSessions, nextSession } = useActivitySessions(
    activity,
    initialSessionId
  );
  const { mapAddress, mapRegion } = useActivityLocation({ activity, nextSession });

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
          setActivity(mapActivityDetail(data));
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
    if (!activity?._id) return;
    setOptimisticFacilitatorRequest(true);
    try {
      await requestFacilitator(activity._id, userId, token || '');
      const updated = await fetchActivityDetails(activity._id, token || '');
      setActivity(mapActivityDetail(updated));
    } catch (err) {
      const msg = err.message || 'Failed to send facilitator request';
      if (msg.toLowerCase().includes('already')) {
        setOptimisticFacilitatorRequest(true);
        try {
          const updated = await fetchActivityDetails(activity._id, token || '');
          setActivity(mapActivityDetail(updated));
        } catch (_) {}
      } else {
        setOptimisticFacilitatorRequest(false);
      }
      Alert.alert('Request Error', msg);
    }
  }, [activity?._id, token]);

  const handleParticipantRequest = useCallback(async (userId) => {
    if (!activity?._id) return;
    setOptimisticParticipantRequest(true);
    try {
      await requestParticipation(activity._id, userId, token || '');
      const updated = await fetchActivityDetails(activity._id, token || '');
      setActivity(mapActivityDetail(updated));
    } catch (err) {
      const msg = err.message || 'Failed to send participation request';
      if (msg.toLowerCase().includes('already')) {
        setOptimisticParticipantRequest(true);
        try {
          const updated = await fetchActivityDetails(activity._id, token || '');
          setActivity(mapActivityDetail(updated));
        } catch (_) {}
      } else {
        setOptimisticParticipantRequest(false);
      }
      Alert.alert('Request Error', msg);
    }
  }, [activity?._id, token]);

  return {
    activity,
    setActivity,
    activityPreload: mappedPreload,
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
  };
};

export default useActivityDetail;

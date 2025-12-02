import React, {
  useEffect,
  useMemo,
  useState,
  useRef,
  useCallback,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  UIManager,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import themeVariables from '../../../styles/theme';
import useActivityDetail from './hooks/useActivityDetail';
import { getActivityChatParticipantProfiles } from '../../../services/ChatService';
import useChatStarter from '../common/useChatStarter';
import useHydrateMembers from './hooks/useHydrateMembers';
import ActivityCardBody from './ActivityCardBody';
import useGoogleMaps from '../../../hooks/useGoogleMaps';
import ActivityLoader from './ActivityLoader';
import useDetailCardHeader from '../common/useDetailCardHeader';

const TAB_BAR_HEIGHT = 80;

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const ActivityDetailCard = ({ route }) => {
  const {
    activity,
    activityPreload,
    activityId,
    loading,
    error,
    errorStatus,
    handleShare,
    handleFacilitatorRequest,
    handleParticipantRequest,
    optimisticFacilitatorRequest,
    optimisticParticipantRequest,
    detailsLoaded,
    insets,
    user,
    token,
  } = useActivityDetail({ route });

  const navigation = useNavigation();
  const safeAreaBottom = insets?.bottom || 0;
  const { initialSessionId } = route.params || {};
  const [prefillActivity, setPrefillActivity] = useState(activityPreload || null);
  const [redirected, setRedirected] = useState(false);
  const prefillParamsSetRef = useRef(false);

  useEffect(() => {
    console.log('[ActivityDetailCard] route', { name: route?.name, params: route?.params });
  }, [route]);

  useEffect(() => {
    if (activity) {
      console.log('[ActivityDetailCard] activity', activity);
    }
  }, [activity]);

  useEffect(() => {
    setPrefillActivity(activityPreload || null);
  }, [activityPreload]);

  const { hydratedActivity, hydratedPrefillActivity } = useHydrateMembers({
    activity,
    prefillActivity,
    token,
  });

  const scrollContentStyle = useMemo(
    () => ({
      paddingTop: 0,
      paddingBottom: Math.max(30, safeAreaBottom + TAB_BAR_HEIGHT),
    }),
    [safeAreaBottom],
  );

  const latestActivityForChat = hydratedActivity || hydratedPrefillActivity || activityPreload || {};
  const chatParticipantProfiles = useMemo(
    () => getActivityChatParticipantProfiles(latestActivityForChat),
    [latestActivityForChat],
  );

  const { startChat, startingChat } = useChatStarter({
    activity: latestActivityForChat,
    activityId,
    context: 'activity',
    token,
    user,
    navigation,
    chatParticipantProfiles,
  });

  const { openGoogleMaps } = useGoogleMaps();
  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.navigate('Activities');
  }, [navigation]);

  useEffect(() => {
    if (!hydratedActivity || prefillParamsSetRef.current) return;
    navigation.setParams({
      prefilledFacilitators: hydratedActivity.facilitators || [],
      prefilledParticipants: hydratedActivity.participants || [],
    });
    prefillParamsSetRef.current = true;
  }, [hydratedActivity, navigation]);

  useDetailCardHeader({
    navigation,
    onBack: handleBack,
    onShare: handleShare,
    onChat: startChat,
    chatLoading: startingChat,
    showChat: true,
  });

  useEffect(() => {
    if (redirected || loading) return;
    if (errorStatus === 404) {
      navigation.replace('Activities', { bannerMessage: 'Sorry, that activity no longer exists.' });
      setRedirected(true);
    } else if (errorStatus === 401) {
      navigation.replace('Activities', { bannerMessage: 'Please log in to view this activity.' });
      setRedirected(true);
    } else if (errorStatus === 'invalid_id') {
      navigation.replace('Activities', { bannerMessage: 'Invalid activity link.' });
      setRedirected(true);
    }
  }, [errorStatus, redirected, loading, navigation]);

  if (!activityId) {
    return (
      <View style={styles.centered}>
        <Text style={styles.noActivityText}>No activity to display.</Text>
      </View>
    );
  }

  return (
    <ActivityLoader
      loading={loading}
      error={error}
      hydratedActivity={hydratedActivity}
      hydratedPrefillActivity={hydratedPrefillActivity}
      scrollContentStyle={scrollContentStyle}
    >
      {(activityToRender) => (
        <ActivityCardBody
          activity={activityToRender}
          openGoogleMaps={openGoogleMaps}
          userId={user?._id || user?.id}
          detailsLoaded={detailsLoaded}
          initialSessionId={initialSessionId}
          onRequestFacilitator={handleFacilitatorRequest}
          onRequestParticipant={handleParticipantRequest}
          optimisticFacilitatorRequest={optimisticFacilitatorRequest}
          optimisticParticipantRequest={optimisticParticipantRequest}
        />
      )}
    </ActivityLoader>
  );
};

export default ActivityDetailCard;

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: themeVariables.whiteColor,
  },
  noActivityText: { color: '#666', fontSize: 18 },
});

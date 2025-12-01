import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  useRef,
} from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  UIManager,
  Platform,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import SwipeToCloseScrollView from '../../../components/SwipeToCloseScrollView';
import themeVariables from '../../../styles/theme';
import useActivityDetail from './hooks/useActivityDetail';
import { getActivityChatParticipantProfiles } from '../../../services/ChatService';
import useChatStarter from './hooks/useChatStarter';
import useHydrateMembers from './hooks/useHydrateMembers';
import ActivityCardBody from './ActivityCardBody';
import useGoogleMaps from '../../../hooks/useGoogleMaps';

const HEADER_OFFSET = 0;
const TAB_BAR_HEIGHT = 80;

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { height: windowHeight } = Dimensions.get('window');

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
      paddingTop: HEADER_OFFSET,
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
    token,
    user,
    navigation,
    chatParticipantProfiles,
  });

  const { openGoogleMaps } = useGoogleMaps();

  useEffect(() => {
    if (!hydratedActivity || prefillParamsSetRef.current) return;
    navigation.setParams({
      prefilledFacilitators: hydratedActivity.facilitators || [],
      prefilledParticipants: hydratedActivity.participants || [],
    });
    prefillParamsSetRef.current = true;
  }, [hydratedActivity, navigation]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[
              styles.headerActionButton,
              startingChat && styles.headerActionButtonDisabled,
            ]}
            onPress={startChat}
            disabled={startingChat}
          >
            {startingChat ? (
              <ActivityIndicator size="small" color={themeVariables.primaryColor} />
            ) : (
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={20}
                color={themeVariables.blackColor}
              />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerActionButton, styles.headerActionButtonSpacer]}
            onPress={handleShare}
          >
            <Ionicons name="share-outline" size={20} color={themeVariables.blackColor} />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, handleShare, startChat, startingChat]);

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

  const canRenderPreloadWhileLoading = Boolean(hydratedPrefillActivity);

  if (loading && canRenderPreloadWhileLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={[ 'left', 'right', 'bottom' ]}>
        <StatusBar
          animated={true}
          translucent={true}
          backgroundColor="transparent"
          barStyle="light-content"
        />
        <SwipeToCloseScrollView
          style={styles.scrollView}
          contentContainerStyle={scrollContentStyle}
          overScrollMode="always"
          scrollEventThrottle={16}
          threshold={HEADER_OFFSET / 2}
        >
          <ActivityCardBody
            activity={hydratedPrefillActivity}
            openGoogleMaps={openGoogleMaps}
            userId={user?._id || user?.id}
            detailsLoaded={detailsLoaded}
            initialSessionId={initialSessionId}
            onRequestFacilitator={handleFacilitatorRequest}
            onRequestParticipant={handleParticipantRequest}
            optimisticFacilitatorRequest={optimisticFacilitatorRequest}
            optimisticParticipantRequest={optimisticParticipantRequest}
          />
        </SwipeToCloseScrollView>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (loading || !hydratedActivity) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={themeVariables.primaryColor} />
        <Text style={styles.loadingText}>
          {loading ? 'Loading activity...' : 'Activity details not available.'}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={[ 'left', 'right', 'bottom' ]}>
      <StatusBar
        animated={true}
        translucent={true}
        backgroundColor="transparent"
        barStyle="light-content"
      />
      <SwipeToCloseScrollView
        style={styles.scrollView}
        contentContainerStyle={scrollContentStyle}
        overScrollMode="always"
        scrollEventThrottle={16}
        threshold={HEADER_OFFSET / 2}
      >
        <ActivityCardBody
          activity={hydratedActivity}
          openGoogleMaps={openGoogleMaps}
          userId={user?._id || user?.id}
          detailsLoaded={detailsLoaded}
          initialSessionId={initialSessionId}
          onRequestFacilitator={handleFacilitatorRequest}
          onRequestParticipant={handleParticipantRequest}
          optimisticFacilitatorRequest={optimisticFacilitatorRequest}
          optimisticParticipantRequest={optimisticParticipantRequest}
        />
      </SwipeToCloseScrollView>
    </SafeAreaView>
  );
};

export default ActivityDetailCard;

const styles = StyleSheet.create({
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerActionButton: {
    backgroundColor: themeVariables.greyColor,
    borderRadius: themeVariables.borderRadiusPill,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  headerActionButtonSpacer: {
    marginLeft: 8,
    marginRight: 8,
  },
  headerActionButtonDisabled: {
    opacity: 0.7,
  },
  safeArea: {
    flex: 1,
    backgroundColor: themeVariables.whiteColor || '#fff',
  },
  scrollView: {
    flex: 1,
    backgroundColor: themeVariables.whiteColor || '#fff',
  },
  centered: {
    flex: 1,
    minHeight: windowHeight,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: themeVariables.whiteColor,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: themeVariables.textColor || '#555',
  },
  errorText: { color: 'red', fontSize: 16 },
  noActivityText: { color: '#666', fontSize: 18 },
});

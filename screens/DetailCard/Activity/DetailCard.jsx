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
const USER_MEMBER_TYPES = ['user'];

const extractMemberType = (entry = {}) => {
  const candidates = [
    entry.type,
    entry.memberType,
    entry.refType,
    entry.referenceType,
    entry.entityType,
    entry.targetType,
    entry.details?.type,
    entry.user?.type,
    entry.profile?.type,
    entry.account?.type,
    entry.ref?.type,
    entry.reference?.type,
  ];
  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== 'string') continue;
    const normalized = candidate.trim().toLowerCase();
    if (normalized) return normalized;
  }
  return '';
};

const isUserMemberEntry = (entry) => {
  if (!entry || typeof entry !== 'object') return false;
  const memberType = extractMemberType(entry);
  if (!memberType) return false;
  return USER_MEMBER_TYPES.includes(memberType);
};

const resolveMemberId = (entry = {}) => {
  const candidates = [
    entry.refId,
    entry._id,
    entry.id,
    entry.userId,
    entry.user_id,
    entry.user?.id,
    entry.user?._id,
    entry.details?.id,
    entry.details?._id,
    entry.profile?.id,
    entry.profile?._id,
    entry.account?.id,
    entry.account?._id,
  ];
  for (const candidate of candidates) {
    if (candidate === undefined || candidate === null) continue;
    const normalized = String(candidate).trim();
    if (normalized.length) return normalized;
  }
  return '';
};

const resolveMemberName = (entry = {}) => {
  const candidates = [
    entry.name,
    entry.fullName,
    entry.firstName && entry.lastName ? `${entry.firstName} ${entry.lastName}` : '',
    entry.firstName,
    entry.lastName,
    entry.username,
    entry.email,
    entry.user?.name,
    entry.user?.fullName,
    entry.details?.name,
    entry.details?.fullName,
  ];
  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== 'string') continue;
    const normalized = candidate.trim();
    if (normalized.length) return normalized;
  }
  return '';
};

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
  const [redirected, setRedirected] = useState(false);
  const prefillParamsSetRef = useRef(false);

  const pickLatestSession = useCallback((sessions = []) => {
    if (!Array.isArray(sessions) || sessions.length === 0) return null;
    return sessions.reduce((latest, session) => {
      const dateValue = session?.date || session?.createdAt || session?.updatedAt;
      const time = dateValue ? new Date(dateValue).getTime() : 0;
      if (!latest || time > latest.time) {
        return { session, time };
      }
      return latest;
    }, null)?.session;
  }, []);

  const { hydratedActivity, hydratedPrefillActivity } = useHydrateMembers({
    activity,
    prefillActivity: activityPreload,
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
    if (prefillParamsSetRef.current) return;
    const detail = hydratedActivity || hydratedPrefillActivity || activityPreload || activity;
    if (!detail) return;
    const latestSession = pickLatestSession(detail.sessions || []);
    const prefillFacilitators =
      (latestSession?.facilitators && latestSession.facilitators.length > 0 && latestSession.facilitators) ||
      detail.facilitators ||
      [];
    const prefillParticipants =
      (latestSession?.participants && latestSession.participants.length > 0 && latestSession.participants) ||
      detail.participants ||
      [];
    navigation.setParams({
      activityReady: true,
      prefilledFacilitators: prefillFacilitators,
      prefilledParticipants: prefillParticipants,
    });
    prefillParamsSetRef.current = true;
  }, [activity, activityPreload, hydratedActivity, hydratedPrefillActivity, navigation, pickLatestSession]);

  const chatEligibleMemberCount = useMemo(() => {
    const memberLists = [latestActivityForChat?.participants, latestActivityForChat?.facilitators];
    const keys = new Set();

    memberLists.forEach((list, listIndex) => {
      if (!Array.isArray(list)) return;
      list.forEach((entry, entryIndex) => {
        if (!isUserMemberEntry(entry)) return;
        const key =
          resolveMemberId(entry) ||
          resolveMemberName(entry) ||
          `member-${listIndex}-${entryIndex}`;
        keys.add(key);
      });
    });

    return keys.size;
  }, [latestActivityForChat]);

  const shouldShowChat = chatEligibleMemberCount >= 2;

  useDetailCardHeader({
    navigation,
    onBack: handleBack,
    onShare: handleShare,
    onChat: startChat,
    chatLoading: startingChat,
    showChat: shouldShowChat,
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

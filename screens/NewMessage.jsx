import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import FastImage from 'react-native-fast-image';

import themeVariables from '../styles/theme';
import { UserContext } from '../contexts/UserContext';
import { CommunityContext } from '../contexts/CommunityContext';
import { getMemberList } from '../services/UserService';
import { createChat, isUserEligibleForActivityChat, fetchChatActivities } from '../services/ChatService';
import { API_URL } from '../config';

const normalizeMemberEntries = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.memberDetails)) return payload.memberDetails;
  if (Array.isArray(payload?.data?.memberDetails)) return payload.data.memberDetails;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const isUserMemberEntry = (entry) => {
  if (!entry || typeof entry !== 'object') return false;
  const candidate =
    entry.details ||
    entry.user ||
    entry.profile ||
    entry.account ||
    entry.member ||
    entry.refId ||
    entry.ref ||
    entry.reference ||
    entry;

  const typeCandidates = [
    entry.type,
    entry.entityType,
    entry.memberType,
    entry.referenceType,
    entry.refType,
    entry.targetType,
    candidate?.type,
    candidate?.entityType,
    candidate?.memberType,
  ];

  return typeCandidates.some((value) => {
    if (!value || typeof value !== 'string') return false;
    const normalized = value.trim().toLowerCase();
    return normalized === 'user';
  });
};

const resolveAvatarSource = (avatar) => {
  if (!avatar) return '';
  if (typeof avatar === 'object') {
    if (typeof avatar.uri === 'string') {
      return resolveAvatarSource(avatar.uri);
    }
    const nested =
      avatar.url ||
      avatar.path ||
      avatar.href ||
      avatar.value;
    if (nested) {
      return resolveAvatarSource(nested);
    }
    return '';
  }
  if (typeof avatar !== 'string') return '';
  const trimmed = avatar.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed) || /^data:/i.test(trimmed)) {
    return trimmed;
  }
  const normalized = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${API_URL}${normalized}`;
};

const normalizeMemberRecord = (entry) => {
  if (!entry) return null;
  const candidate =
    entry.details ||
    entry.profile ||
    entry.user ||
    entry.account ||
    entry.member ||
    entry.refId ||
    entry.ref ||
    entry.reference ||
    entry;

  const id =
    candidate?._id ||
    candidate?.id ||
    candidate?.userId ||
    candidate?.user_id ||
    entry?._id ||
    entry?.id ||
    null;

  const firstName =
    entry.fullName ||
    candidate?.fullName ||
    candidate?.firstName ||
    candidate?.first_name ||
    entry.firstName ||
    entry.first_name ||
    '';

  const lastName =
    candidate?.lastName ||
    candidate?.last_name ||
    entry.lastName ||
    entry.last_name ||
    '';

  const composedName =
    typeof firstName === 'string' && firstName.includes(' ')
      ? firstName
      : [firstName, lastName].map((part) => (typeof part === 'string' ? part.trim() : '')).filter(Boolean).join(' ');

  const email = candidate?.email || entry.email || '';
  const role = entry.communityRole || entry.role || candidate?.role || '';
  const phone = candidate?.phoneNumber || candidate?.phone_number || entry.phoneNumber || '';
  const avatar = resolveAvatarSource(
    candidate?.profilePicture ||
      candidate?.profilePictureUrl ||
      candidate?.profile?.profilePicture ||
      candidate?.profile?.avatar ||
      candidate?.avatar ||
      candidate?.avatarUrl ||
      candidate?.photo ||
      candidate?.image ||
      candidate?.media?.avatar ||
      entry.profilePicture ||
      entry.profile_picture ||
      entry.profile?.profilePicture ||
      entry.avatar ||
      entry.avatarUrl ||
      entry.photo ||
      entry.image ||
      entry.media?.avatar,
  );

  const displayName = entry.fullName || composedName || email || phone || 'Member';
  const subtitle = email || role || phone || '';

  const searchHaystack = [displayName, email, role, phone]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return {
    _id: id ? String(id) : null,
    displayName,
    subtitle,
    avatar,
    searchHaystack,
    source: candidate || entry,
    raw: entry,
  };
};

const extractActivityId = (activity) => {
  if (!activity) return '';
  const candidates = [
    activity._id,
    activity.id,
    activity.activityId,
    activity.activity_id,
    activity.slug,
    activity.activity?.id,
    activity.activity?._id,
    activity.activity?.activityId,
    activity.details?.activityId,
  ];
  for (const candidate of candidates) {
    if (!candidate) continue;
    const value = String(candidate).trim();
    if (value) return value;
  }
  return '';
};

const resolveActivityImage = (activity = {}) => {
  const candidates = [
    activity.bannerImage,
    activity.imageUrl,
    activity.imageURL,
    activity.bannerUrl,
    activity.bannerURL,
    activity.heroImage,
    activity.photo,
    activity.image,
    activity.coverImage,
    activity.media?.banner,
  ];
  for (const candidate of candidates) {
    const normalized = resolveAvatarSource(candidate);
    if (normalized) return normalized;
  }
  return '';
};

const getActivityTitle = (activity = {}) => {
  return (
    activity.title ||
    activity.name ||
    activity.activityTitle ||
    activity.groupName ||
    'Activity Chat'
  );
};

const hasMinimumParticipants = (activity = {}) => {
  const participants = Array.isArray(activity.participantIds)
    ? activity.participantIds
    : [];
  const facilitators = Array.isArray(activity.facilitatorIds)
    ? activity.facilitatorIds
    : [];
  const uniqueIds = new Set();
  [...participants, ...facilitators].forEach((id) => {
    if (!id) return;
    const value = String(id).trim();
    if (value) uniqueIds.add(value);
  });
  return uniqueIds.size >= 2;
};

const MemberRow = ({ member, disabled, onPress, isBusy }) => {
  const initials = useMemo(() => {
    if (!member?.displayName) return '';
    const parts = member.displayName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0] || ''}${parts[parts.length - 1][0] || ''}`.toUpperCase();
  }, [member?.displayName]);

  const avatarUri = useMemo(() => {
    if (!member) return '';
    const candidates = [
      member.avatar,
      member.source?.profilePicture,
      member.source?.profile_picture,
      member.source?.profile?.profilePicture,
      member.source?.avatar,
      member.source?.photo,
      member.source?.image,
      member.raw?.profilePicture,
      member.raw?.profile_picture,
      member.raw?.avatar,
      member.raw?.photo,
      member.raw?.image,
    ];
    for (const candidate of candidates) {
      const resolved = resolveAvatarSource(candidate);
      if (resolved) return resolved;
    }
    return '';
  }, [member]);

  return (
    <TouchableOpacity
      style={styles.memberRow}
      onPress={() => onPress?.(member)}
      disabled={disabled || isBusy}
      activeOpacity={0.85}
    >
      <View style={styles.memberAvatarWrapper}>
        {avatarUri ? (
          <FastImage
            source={{ uri: avatarUri }}
            style={styles.memberAvatarImage}
            resizeMode={FastImage.resizeMode.cover}
          />
        ) : (
          <View style={styles.memberAvatarFallback}>
            <Text style={styles.memberAvatarFallbackText}>{initials || 'LS'}</Text>
          </View>
        )}
      </View>
      <View style={styles.memberContent}>
        <Text style={styles.memberName} numberOfLines={1}>
          {member?.displayName}
        </Text>
        {Boolean(member?.subtitle) && (
          <Text style={styles.memberSubtitle} numberOfLines={1}>
            {member.subtitle}
          </Text>
        )}
      </View>
      {isBusy ? (
        <ActivityIndicator size="small" color={themeVariables.primaryColor} />
      ) : (
        <Ionicons name="chevron-forward" size={18} color="#B0B0B0" />
      )}
    </TouchableOpacity>
  );
};

const SuggestedActivityCard = ({ activity, busy, onPress }) => {
  const title = getActivityTitle(activity);
  const imageUri =
    resolveAvatarSource(activity.bannerImage) ||
    resolveActivityImage(activity);
  return (
    <TouchableOpacity
      style={[styles.suggestedChip, busy && styles.suggestedCardBusy]}
      onPress={() => onPress?.(activity)}
      disabled={busy}
      activeOpacity={0.85}
    >
      {imageUri ? (
        <FastImage
          source={{ uri: imageUri }}
          style={styles.suggestedChipAvatar}
          resizeMode={FastImage.resizeMode.cover}
        />
      ) : (
        <View style={styles.suggestedChipFallback}>
          <Ionicons name="people-outline" size={18} color={themeVariables.whiteColor} />
        </View>
      )}
      <Text style={styles.suggestedChipText} numberOfLines={1}>
        {title}
      </Text>
      {busy && <ActivityIndicator size="small" color={themeVariables.primaryColor} />}
    </TouchableOpacity>
  );
};

const NewMessage = () => {
  const navigation = useNavigation();
  const { token, user } = useContext(UserContext);
  const { communityId } = useContext(CommunityContext);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [creatingFor, setCreatingFor] = useState(null);
  const [activityChatBusyId, setActivityChatBusyId] = useState(null);
  const [suggestedActivities, setSuggestedActivities] = useState([]);

  useEffect(() => {
    let cancelled = false;
    const loadSuggestions = async () => {
      if (!token) return;
      try {
        const activities = await fetchChatActivities({ token });
        console.log('Fetched chat activities payload:', activities);
        if (cancelled) return;
        const map = new Map();
        activities.forEach((activity) => {
          const id = extractActivityId(activity);
          if (!id || map.has(id)) return;
          if (activity.hasChat) return;
          if (!hasMinimumParticipants(activity)) return;
          map.set(id, activity);
        });
        setSuggestedActivities(Array.from(map.values()));
      } catch (err) {
        if (!cancelled) {
          console.warn('Unable to load suggested chats:', err?.message || err);
        }
      }
    };
    loadSuggestions();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const currentUserId = useMemo(
    () => user?._id || user?.id || user?.userId || null,
    [user],
  );

  const fetchMembers = useCallback(
    async (silent = false) => {
      if (!communityId) {
        setError('Join a community to start new conversations.');
        setMembers([]);
        return;
      }
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError('');
      try {
        const response = await getMemberList(communityId);
        console.log('Fetched community members payload:', response);
        const normalizedList = normalizeMemberEntries(response)
          .filter((entry) => isUserMemberEntry(entry))
          .map(normalizeMemberRecord)
          .filter(
            (member) =>
              member &&
              member._id &&
              (!currentUserId || member._id !== String(currentUserId)),
          );
        setMembers(normalizedList);
      } catch (err) {
        const message = err?.message || 'Unable to load community members.';
        setError(message);
      } finally {
        if (silent) {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    },
    [communityId, currentUserId],
  );

  const removeSuggestedActivity = useCallback((activityId) => {
    if (!activityId) return;
    setSuggestedActivities((prev) =>
      prev.filter((entry) => extractActivityId(entry) !== activityId),
    );
  }, []);

  useEffect(() => {
    fetchMembers(false);
  }, [fetchMembers]);

  const filteredMembers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return members;
    return members.filter((member) => member.searchHaystack.includes(query));
  }, [members, searchQuery]);

  const handleSelectMember = useCallback(
    async (member) => {
      if (!member?._id || creatingFor) return;
      setCreatingFor(member._id);
      try {
        const payload = {
          participantIds: [member._id],
        };
        const response = await createChat(payload, { token });
        const chatData =
          response?.data ||
          response?.chat ||
          response ||
          null;
        const chatId = chatData?._id || chatData?.id;
        if (!chatId) {
          throw new Error('Unable to open the new chat.');
        }
        const chatParticipants = chatData?.participants || [member.source];
        const isGroupChat =
          (chatData?.type || '').trim().toLowerCase() === 'group' ||
          (Array.isArray(chatParticipants) && chatParticipants.length > 2);
        const chatTitle = isGroupChat
          ? chatData?.title ||
            chatData?.name ||
            chatData?.chatName ||
            member.displayName
          : 'Conversation';
        const chatImage = isGroupChat
          ? resolveAvatarSource(
              chatData?.imageUrl ||
                chatData?.avatar ||
                chatData?.image ||
                chatData?.photo ||
                member.avatar,
            ) || member.avatar
          : undefined;
        navigation.replace('ChatDetail', {
          chatId,
          chatTitle,
          chatParticipants,
          chatImage,
        });
      } catch (err) {
        const message = err?.message || 'Unable to start a chat right now.';
        Alert.alert('Chat unavailable', message);
      } finally {
        setCreatingFor(null);
      }
    },
    [token, navigation, creatingFor],
  );

  const handleRefresh = useCallback(() => {
    fetchMembers(true);
  }, [fetchMembers]);

  const renderMember = useCallback(
    ({ item }) => (
      <MemberRow
        member={item}
        disabled={!token}
        isBusy={creatingFor === item._id}
        onPress={handleSelectMember}
      />
    ),
    [token, creatingFor, handleSelectMember],
  );

  const keyExtractor = useCallback(
    (item, index) => item?._id || `member-${index}`,
    [],
  );

  const handleStartActivityChat = useCallback(
    async (activity) => {
      const activityId = extractActivityId(activity);
      if (!activity || !activityId || activityChatBusyId === activityId) return;
      if (!token) {
        Alert.alert('Sign in required', 'Please sign in to start an activity chat.');
        return;
      }

      if (activity.hasChat && activity.chatId) {
        removeSuggestedActivity(activityId);
        navigation.replace('ChatDetail', {
          chatId: activity.chatId,
          chatTitle: getActivityTitle(activity),
          chatImage:
            resolveAvatarSource(activity.bannerImage) ||
            resolveActivityImage(activity),
        });
        return;
      }

      setActivityChatBusyId(activityId);
      try {
        const participantIdsSet = new Set();
        if (Array.isArray(activity.participantIds)) {
          activity.participantIds.forEach((id) => {
            if (id) participantIdsSet.add(String(id));
          });
        }
        if (Array.isArray(activity.facilitatorIds)) {
          activity.facilitatorIds.forEach((id) => {
            if (id) participantIdsSet.add(String(id));
          });
        }
        const createPayload = {
          activityId,
          name: getActivityTitle(activity),
          imageUrl:
            resolveAvatarSource(activity.bannerImage) ||
            resolveActivityImage(activity),
        };
        if (participantIdsSet.size > 0) {
          createPayload.participantIds = Array.from(participantIdsSet);
        }
        const response = await createChat(createPayload, { token });
        const chatData =
          response?.data ||
          response?.chat ||
          response ||
          null;
        const chatId = chatData?._id || chatData?.id;
        if (!chatId) {
          throw new Error('Unable to open the chat conversation for this activity.');
        }
        const chatParticipants = chatData?.participants || [];
        const chatType = chatData?.type || (chatParticipants.length > 2 ? 'group' : 'direct');
        const chatTitle =
          chatType === 'group'
            ? chatData?.name ||
              chatData?.title ||
              chatData?.chatName ||
              getActivityTitle(activity)
            : 'Conversation';
        const chatImage =
          chatType === 'group'
            ? resolveAvatarSource(
                chatData?.imageUrl ||
                  chatData?.avatar ||
                  chatData?.image ||
                  chatData?.photo,
              ) || resolveActivityImage(activity)
            : undefined;

        navigation.replace('ChatDetail', {
          chatId,
          chatTitle,
          chatParticipants,
          chatImage,
        });
        removeSuggestedActivity(activityId);
      } catch (err) {
        const message = err?.message || 'Unable to start this chat right now.';
        Alert.alert('Chat unavailable', message);
      } finally {
        setActivityChatBusyId(null);
      }
    },
    [activityChatBusyId, token, navigation, removeSuggestedActivity],
  );

  const suggestedKeyExtractor = useCallback(
    (item, index) => extractActivityId(item) || `suggested-${index}`,
    [],
  );

  const renderSuggestedHeader = useCallback(() => {
    const hasSuggestions = suggestedActivities.length > 0;
    return (
      <View>
        {hasSuggestions && (
          <>
            <Text style={styles.sectionTitle}>Suggested</Text>
            <FlatList
              horizontal
              data={suggestedActivities}
              keyExtractor={suggestedKeyExtractor}
              renderItem={({ item }) => (
                <SuggestedActivityCard
                  activity={item}
                  onPress={handleStartActivityChat}
                  busy={activityChatBusyId === extractActivityId(item)}
                />
              )}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.suggestedListContent}
            />
            <Text style={[styles.sectionTitle, styles.sectionTitleSpacing]}>
              Community members
            </Text>
          </>
        )}
        {!hasSuggestions && (
          <Text style={styles.sectionTitle}>Community members</Text>
        )}
      </View>
    );
  }, [
    suggestedActivities,
    suggestedKeyExtractor,
    handleStartActivityChat,
    activityChatBusyId,
  ]);

  const renderHeader = useMemo(
    () => (
      <Text style={styles.sectionTitle}>Community members</Text>
    ),
    [],
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search community members"
          placeholderTextColor="#AAA"
          autoCapitalize="none"
          autoCorrect={false}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {Boolean(searchQuery) && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color="#AAA" />
          </TouchableOpacity>
        )}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {loading ? (
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="large" color={themeVariables.primaryColor} />
          <Text style={styles.loadingText}>Loading members…</Text>
        </View>
      ) : (
        <FlatList
          data={filteredMembers}
          keyExtractor={keyExtractor}
          renderItem={renderMember}
          contentContainerStyle={
            filteredMembers.length === 0 ? styles.emptyContainer : undefined
          }
          ListHeaderComponent={renderSuggestedHeader}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {searchQuery
                ? 'No members match your search.'
                : 'No community members available yet.'}
            </Text>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={themeVariables.primaryColor}
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

export default NewMessage;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: themeVariables.whiteColor,
    paddingTop: 16,
    paddingHorizontal: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: themeVariables.borderColor,
    borderRadius: themeVariables.borderRadiusPill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 12,
    marginHorizontal: 12,
    marginTop: 8,
    backgroundColor: themeVariables.formInputBg,
    shadowColor: 'rgba(0,0,0,0.05)',
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: themeVariables.blackColor,
    fontSize: 15,
  },
  errorText: {
    color: themeVariables.redColor,
    marginBottom: 8,
  },
  loadingWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#777',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: themeVariables.borderRadiusPill,
    backgroundColor: themeVariables.whiteColor,
    marginBottom: 10,
    shadowColor: 'rgba(0,0,0,0.05)',
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 1,
  },
  memberAvatarWrapper: {
    marginRight: 12,
  },
  memberAvatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  memberAvatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: themeVariables.primaryColor,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberAvatarFallbackText: {
    color: themeVariables.whiteColor,
    fontWeight: '600',
  },
  memberContent: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    color: themeVariables.blackColor,
    fontWeight: '600',
  },
  memberSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#777',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 13,
    textTransform: 'uppercase',
    color: '#888',
    letterSpacing: 0.6,
    marginBottom: 8,
    fontWeight: '600',
    marginLeft: 12,
  },
  sectionTitleSpacing: {
    marginTop: 16,
  },
  suggestedListContent: {
    paddingBottom: 8,
    paddingRight: 12,
  },
  suggestedCardBusy: {
    opacity: 0.7,
  },
  suggestedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: themeVariables.borderRadiusPill,
    backgroundColor: themeVariables.screenBackgroundColor,
    marginRight: 12,
  },
  suggestedChipAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  suggestedChipFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: themeVariables.primaryColor,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  suggestedChipText: {
    fontSize: 14,
    color: themeVariables.blackColor,
    fontWeight: '600',
    flex: 1,
  },
});

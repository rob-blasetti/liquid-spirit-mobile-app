import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
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
import { ChatContext } from '../contexts';
import { getMemberList } from '../services/UserService';
import { createChat, fetchChatActivities } from '../services/ChatService';
import {
  buildNormalizedMemberList,
  extractActivityId,
  getActivityTitle,
  prepareSuggestedActivities,
  resolveActivityImage,
  resolveAvatarSource,
} from '../utils/chatSuggestions';
import SearchBar from '../components/SearchBar';

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
  const { newMessagePrefetch, prefetchNewMessageData } = useContext(ChatContext);
  const prefetchedMembers = newMessagePrefetch?.members || [];
  const prefetchedSuggestions = newMessagePrefetch?.suggestedActivities || [];
  const [members, setMembers] = useState(prefetchedMembers);
  const [loading, setLoading] = useState(prefetchedMembers.length === 0);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [creatingFor, setCreatingFor] = useState(null);
  const [activityChatBusyId, setActivityChatBusyId] = useState(null);
  const [suggestedActivities, setSuggestedActivities] = useState(prefetchedSuggestions);

  useEffect(() => {
    if (!token) return;
    prefetchNewMessageData?.({ silent: true }).catch(() => {});
  }, [token, prefetchNewMessageData]);

  useEffect(() => {
    let cancelled = false;
    const loadSuggestions = async () => {
      if (!token || suggestedActivities.length > 0) return;
      try {
        const activities = await fetchChatActivities({ token });
        console.log('Fetched chat activities payload:', activities);
        if (cancelled) return;
        const prepared = prepareSuggestedActivities(activities);
        setSuggestedActivities(prepared);
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
  }, [token, suggestedActivities.length]);

  const currentUserId = useMemo(
    () => user?._id || user?.id || user?.userId || null,
    [user],
  );

  const fetchMembers = useCallback(
    async (silent = false) => {
      if (!communityId) {
        setError('Join a community to start new conversations.');
        setMembers([]);
        setLoading(false);
        setRefreshing(false);
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
        const normalizedList = buildNormalizedMemberList(response, currentUserId);
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
    if (!members.length) {
      fetchMembers(false);
    }
  }, [fetchMembers, members.length]);

  useEffect(() => {
    if (!newMessagePrefetch) return;
    if (newMessagePrefetch.members) {
      setMembers(newMessagePrefetch.members);
      setLoading(false);
      setRefreshing(false);
    }
    if (newMessagePrefetch.suggestedActivities) {
      setSuggestedActivities(newMessagePrefetch.suggestedActivities);
    }
  }, [newMessagePrefetch]);

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

  return (
    <SafeAreaView style={styles.safeArea}>
      <SearchBar
        placeholder="Search community members"
        value={searchQuery}
        onChangeText={setSearchQuery}
        onCancel={() => setSearchQuery('')}
        showCancel={Boolean(searchQuery)}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        testID="newMessageSearch"
      />

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
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={renderSuggestedHeader}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {searchQuery
                  ? 'No members match your search.'
                  : 'No community members available yet.'}
              </Text>
            </View>
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
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 24,
  },
  emptyText: {
    color: '#777',
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 32,
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
    maxWidth: 260,
    flexShrink: 1,
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
    flexShrink: 1,
    maxWidth: 180,
  },
});

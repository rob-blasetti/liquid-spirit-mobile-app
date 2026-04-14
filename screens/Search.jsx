import React, { useState, useContext, useEffect, useRef, useCallback } from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import themeVariables from '../styles/theme';
import { UserContext } from '../contexts/UserContext';
import { fetchSearchResults, fetchSearchAutocomplete } from '../services/SearchService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config';
import useMountEffect from '../hooks/useMountEffect';
import localImages from '../utils/localImages';
import SearchItem from '../components/SearchItem';
import SearchBar from '../components/SearchBar';
import { CommunityContext } from '../contexts/CommunityContext';
import Avatar from '@liquidspirit/react-native-boring-avatars';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { navigateToPostDetail } from '../utils/navigateToPostDetail';
import { navigateToEventDetail } from '../utils/navigateToEventDetail';
import { navigateToActivityDetail } from '../utils/navigateToActivityDetail';
import debugLog from '../utils/debugLog';

const placeholderImage = require('../assets/img/placeholder.png');
const FULL_SEARCH_MIN_LENGTH = 3;
const FULL_SEARCH_DEBOUNCE_MS = 700;
const SEARCH_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Users', value: 'users' },
  { label: 'Members', value: 'members' },
  { label: 'Events', value: 'events' },
  { label: 'Activities', value: 'activities' },
  { label: 'Posts', value: 'posts' },
];
const RESULT_SECTION_ORDER = ['users', 'members', 'relatedPosts', 'events', 'activities', 'posts', 'other'];
const RESULT_SECTION_CONFIG = {
  users: { title: 'Users', types: ['user'] },
  members: { title: 'Members', types: ['member'] },
  relatedPosts: { title: 'Related Posts', types: [] },
  events: { title: 'Events', types: ['event'] },
  activities: { title: 'Activities', types: ['activity', 'session'] },
  posts: { title: 'Posts', types: ['post'] },
  other: { title: 'Other Results', types: [] },
};
const VALID_SEARCH_TYPES = new Set(SEARCH_FILTERS.map(filter => filter.value).filter(Boolean));

function normalizeSearchType(value) {
  if (typeof value !== 'string') return '';
  const normalized = value.trim().toLowerCase();
  return VALID_SEARCH_TYPES.has(normalized) ? normalized : '';
}

function buildSearchCacheKey(communityId, query, type) {
  const normalizedQuery = query?.trim?.().toLowerCase() ?? '';
  const normalizedType = normalizeSearchType(type) || 'all';
  return `${communityId || 'global'}::${normalizedType}::${normalizedQuery}`;
}

function normalizePersonLabel(...parts) {
  return parts
    .map(part => String(part || '').trim())
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function getResultSectionKey(resultType) {
  const entry = RESULT_SECTION_ORDER.find(sectionKey => {
    const config = RESULT_SECTION_CONFIG[sectionKey];
    return config?.types?.includes(resultType);
  });
  return entry || 'other';
}

function buildResultSections(results) {
  const matchedAuthorIds = new Set();
  const matchedPersonNames = new Set();

  for (const item of results) {
    if (item?.type === 'user' && item.id != null) {
      matchedAuthorIds.add(String(item.id));
    }

    if (item?.type === 'user' || item?.type === 'member') {
      const personLabel = normalizePersonLabel(
        item?.firstName,
        item?.lastName,
        item?.displayName,
      );
      if (personLabel) {
        matchedPersonNames.add(personLabel);
      }
    }
  }

  const hasMatchedPeople = matchedAuthorIds.size > 0 || matchedPersonNames.size > 0;
  const sectionMap = new Map();

  for (const item of results) {
    const authorId = item?.author?.id != null ? String(item.author.id) : '';
    const authorLabel = normalizePersonLabel(item?.author?.firstName, item?.author?.lastName);
    const isRelatedPost = item?.type === 'post'
      && hasMatchedPeople
      && (
        (authorId && matchedAuthorIds.has(authorId))
        || (authorLabel && matchedPersonNames.has(authorLabel))
      );
    const sectionKey = isRelatedPost ? 'relatedPosts' : getResultSectionKey(item?.type);
    const existingSection = sectionMap.get(sectionKey);

    if (existingSection) {
      existingSection.items.push(item);
      continue;
    }

    sectionMap.set(sectionKey, {
      key: sectionKey,
      title: RESULT_SECTION_CONFIG[sectionKey]?.title || 'Other Results',
      items: [item],
    });
  }

  return RESULT_SECTION_ORDER
    .map(sectionKey => sectionMap.get(sectionKey))
    .filter(Boolean);
}

function safeText(val) {
  if (val == null) return '';
  if (typeof val === 'string' || typeof val === 'number') return String(val);
  if (typeof val === 'object' && 'name' in val) return String(val.name);
  try {
    return JSON.stringify(val);
  } catch (_) {
    return '';
  }
}

function truncateText(text, limit) {
  if (!text) return '';
  const str = String(text);
  if (str.length <= limit) return str;
  return `${str.slice(0, limit).trimEnd()}...`;
}

function formatDate(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return String(dateString);
  const day = d.getDate();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = monthNames[d.getMonth()];
  const year = d.getFullYear().toString().slice(-2);
  const j = day % 10;
  const k = day % 100;
  let suffix = 'th';
  if (j === 1 && k !== 11) suffix = 'st';
  else if (j === 2 && k !== 12) suffix = 'nd';
  else if (j === 3 && k !== 13) suffix = 'rd';
  return `${day}${suffix} ${month} '${year}`;
}

function getDayName(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '';
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return dayNames[d.getDay()] || '';
}

function formatGroupTime(timeStr) {
  if (typeof timeStr !== 'string' || !timeStr.includes(':')) return '';
  const [hoursStr, minutesStr] = timeStr.split(':');
  const hours = Number(hoursStr);
  const minutes = Number(minutesStr ?? 0);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return '';
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function formatEventTime(timeValue) {
  if (!timeValue) return '';
  const date = new Date(timeValue);
  if (!Number.isFinite(date.getTime())) return '';
  const formatted = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return typeof formatted === 'string'
    ? formatted.replace(/(am|pm)/gi, match => match.toUpperCase())
    : '';
}

function resolveImageSource(uri) {
  if (!uri) return placeholderImage;
  if (localImages[uri]) return localImages[uri];
  if (typeof uri === 'object' && uri.uri) return uri;
  const stringUri = typeof uri === 'string' ? uri : null;
  if (!stringUri) return placeholderImage;
  if (/^https?:/i.test(stringUri) || /^data:/i.test(stringUri)) {
    return { uri: stringUri };
  }
  const normalized = stringUri.startsWith('/') ? stringUri.slice(1) : stringUri;
  return { uri: `${API_URL}/${normalized}` };
}

function extractMediaUrl(media) {
  if (!media) return null;
  if (typeof media === 'string') return media;
  if (typeof media === 'object') {
    return media.url || media.uri || media.path || null;
  }
  return null;
}

const Search = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState('');
  const [results, setResults] = useState([]);
  const [resultsQuery, setResultsQuery] = useState('');
  const [resultsType, setResultsType] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState([]);
  const [isAutocompleteLoading, setIsAutocompleteLoading] = useState(false);
  const { token, isTokenExpired } = useContext(UserContext);
  const { communityId } = useContext(CommunityContext);
  const [recentSearches, setRecentSearches] = useState([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const debounceRef = useRef(null);
  const autocompleteDebounceRef = useRef(null);
  const inputRef = useRef(null);
  const latestSearchIdRef = useRef(0);
  const latestAutocompleteIdRef = useRef(0);
  const searchCacheRef = useRef(new Map());
  const autocompleteCacheRef = useRef(new Map());
  const searchInFlightRef = useRef(new Map());
  const autocompleteInFlightRef = useRef(new Map());
  const lastExecutedQueryRef = useRef(null);
  const initialQueryKeyRef = useRef(null);
  const didHydrateInitialStateRef = useRef(false);

  const cancelAutocomplete = useCallback(() => {
    if (autocompleteDebounceRef.current) {
      clearTimeout(autocompleteDebounceRef.current);
      autocompleteDebounceRef.current = null;
    }
    setIsAutocompleteLoading(false);
  }, []);
  // Handler for card press navigation
  const handleCardPress = useCallback((selected) => {
    if (!selected) return;
    const primaryId = selected._id || selected.id;

    if (selected.type === 'member' || selected.type === 'user') {
      navigation.navigate('PublicUserProfile', { userId: primaryId });
      return;
    }

    if (selected.type === 'post') {
      navigateToPostDetail({
        navigation,
        post: selected,
        postId: primaryId,
        token,
        isTokenExpired,
      });
      return;
    }

    if (selected.type === 'event') {
      navigateToEventDetail({
        navigation,
        event: selected,
        eventId: primaryId,
        token,
        isTokenExpired,
      });
      return;
    }

    if (selected.type === 'activity') {
      navigateToActivityDetail({
        navigation,
        activity: selected,
        activityId: primaryId,
        token,
        isTokenExpired,
      });
      return;
    }

    if (selected.type === 'session') {
      const activityId = selected.activityId || primaryId;
      navigateToActivityDetail({
        navigation,
        activityId,
        token,
        isTokenExpired,
        params: { initialSessionId: primaryId },
      });
      return;
    }

    if (primaryId) {
      navigateToActivityDetail({
        navigation,
        activityId: primaryId,
        token,
        isTokenExpired,
      });
    }
  }, [navigation, token, isTokenExpired]);
  // Partition results by type for grouped sections
  const getSuggestionLabel = useCallback((suggestion) => {
    if (!suggestion) return '';
    if (typeof suggestion === 'string') return suggestion;
    const personLabel = [safeText(suggestion.firstName), safeText(suggestion.lastName)]
      .filter(Boolean)
      .join(' ')
      .trim();
    return suggestion.label
      || suggestion.name
      || suggestion.title
      || suggestion.displayName
      || personLabel
      || safeText(suggestion.bahaiId).trim()
      || suggestion.query
      || '';
  }, []);

  const getSuggestionType = useCallback((suggestion) => {
    if (!suggestion || typeof suggestion === 'string') return '';
    const rawType = suggestion.type || suggestion.category || suggestion.group;
    if (!rawType || typeof rawType !== 'string') return '';
    return `${rawType.charAt(0).toUpperCase()}${rawType.slice(1)}`;
  }, []);

  const getSuggestionContext = useCallback((suggestion) => {
    if (!suggestion || typeof suggestion === 'string') return '';

    const typeLabel = getSuggestionType(suggestion);
    const communityLabel = safeText(suggestion.community)?.trim();

    switch (suggestion.type) {
      case 'event': {
        const eventDate = formatDate(suggestion.date);
        const eventDay = getDayName(suggestion.date);
        const eventTime = formatEventTime(suggestion.startTime || suggestion.time)
          || safeText(suggestion.startTime || suggestion.time).trim();
        return [typeLabel, eventDay, eventDate, eventTime, communityLabel].filter(Boolean).join(' • ');
      }
      case 'activity':
      case 'session': {
        const activityType = safeText(suggestion.activityType).trim();
        const nextSessionDate = formatDate(
          suggestion.nextSessionDate || suggestion.nextSession?.date || suggestion.date,
        );
        const groupDay = safeText(suggestion.groupDetails?.day).trim();
        const rawGroupTime = suggestion.groupDetails?.time;
        const groupTime = formatGroupTime(rawGroupTime) || safeText(rawGroupTime).trim();
        const scheduleLabel = nextSessionDate
          ? `Next ${nextSessionDate}`
          : [groupDay, groupTime].filter(Boolean).join(' • ');
        return [typeLabel, activityType, scheduleLabel, communityLabel].filter(Boolean).join(' • ');
      }
      case 'post': {
        const authorName = [safeText(suggestion.author?.firstName), safeText(suggestion.author?.lastName)]
          .filter(Boolean)
          .join(' ')
          .trim();
        const createdDate = formatDate(suggestion.createdAt);
        return [
          typeLabel,
          authorName ? `By ${truncateText(authorName, 24)}` : '',
          createdDate,
          communityLabel,
        ].filter(Boolean).join(' • ');
      }
      case 'user':
      case 'member':
        return [typeLabel, communityLabel].filter(Boolean).join(' • ');
      default:
        return [typeLabel, communityLabel].filter(Boolean).join(' • ');
    }
  }, [getSuggestionType]);

  const suggestionKeyExtractor = useCallback((item, index) => {
    const key = typeof item === 'string'
      ? item
      : item.id || item._id || item.value || item.slug || getSuggestionLabel(item);
    return key ? key.toString() : index.toString();
  }, [getSuggestionLabel]);

  const updateRecentSearches = useCallback((rawText) => {
    const trimmed = rawText?.trim?.();
    if (!trimmed) return;
    setRecentSearches(prev => {
      const normalizedTrimmed = trimmed.toLowerCase();
      const filtered = prev.filter(item => item.toLowerCase() !== normalizedTrimmed);
      const next = [trimmed, ...filtered].slice(0, 5);
      AsyncStorage.setItem('search_cache__recent_queries', JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const executeSearch = useCallback(async (text, { force = false, type } = {}) => {
    const normalizedQuery = (text ?? '').trim();
    const normalizedType = normalizeSearchType(type ?? searchType);
    const cacheKey = buildSearchCacheKey(communityId, normalizedQuery, normalizedType);

    if (!force && lastExecutedQueryRef.current === cacheKey) {
      setResultsQuery(normalizedQuery);
      setResultsType(normalizedType);
      return searchCacheRef.current.get(cacheKey) ?? null;
    }

    if (!force && searchCacheRef.current.has(cacheKey)) {
      const cached = searchCacheRef.current.get(cacheKey) ?? [];
      lastExecutedQueryRef.current = cacheKey;
      setResultsQuery(normalizedQuery);
      setResultsType(normalizedType);
      setResults(Array.isArray(cached) ? cached : []);
      return cached;
    }

    const existingRequest = !force ? searchInFlightRef.current.get(cacheKey) : null;
    if (existingRequest) {
      return existingRequest;
    }

    const requestId = ++latestSearchIdRef.current;
    setIsLoading(true);

    const searchPromise = (async () => {
      try {
        const data = await fetchSearchResults(
          normalizedQuery,
          token,
          communityId,
          normalizedType || undefined,
        );
        debugLog('Search results for query', normalizedQuery, data);
        if (latestSearchIdRef.current !== requestId) return null;
        const nextResults = Array.isArray(data) ? data : [];
        searchCacheRef.current.set(cacheKey, nextResults);
        lastExecutedQueryRef.current = cacheKey;
        setResultsQuery(normalizedQuery);
        setResultsType(normalizedType);
        setResults(nextResults);
        if (normalizedQuery.length > 0 && !isSearchFocused) {
          updateRecentSearches(normalizedQuery);
        }
        return nextResults;
      } catch (error) {
        console.error('Search failed:', error);
        if (latestSearchIdRef.current === requestId) {
          setResultsQuery(normalizedQuery);
          setResultsType(normalizedType);
          setResults([]);
        }
        return null;
      } finally {
        searchInFlightRef.current.delete(cacheKey);
        if (latestSearchIdRef.current === requestId) {
          setIsLoading(false);
        }
      }
    })();

    searchInFlightRef.current.set(cacheKey, searchPromise);
    return searchPromise;
  }, [token, communityId, updateRecentSearches, isSearchFocused, searchType]);

  const executeSearchRef = useRef(executeSearch);
  const updateRecentSearchesRef = useRef(updateRecentSearches);
  const committedResultsQueryRef = useRef(resultsQuery);
  const committedResultsTypeRef = useRef(resultsType);
  executeSearchRef.current = executeSearch;
  updateRecentSearchesRef.current = updateRecentSearches;
  committedResultsQueryRef.current = resultsQuery;
  committedResultsTypeRef.current = resultsType;

  useMountEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('search_cache__recent_queries');
        if (!stored) return;
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const sanitized = parsed.filter(item => typeof item === 'string');
          const unique = [];
          sanitized.forEach(entry => {
            if (!entry) return;
            const lower = entry.toLowerCase();
            if (!unique.some(existing => existing.toLowerCase() === lower)) {
              unique.push(entry);
            }
          });
          setRecentSearches(unique.slice(0, 5));
        }
      } catch (_) {}
    })();
  });

  useMountEffect(() => {
    const initialQuery = route.params?.initialQuery;
    const initialQueryTs = route.params?.initialQueryTs;
    const normalizedInitialQuery = typeof initialQuery === 'string' ? initialQuery.trim() : '';

    (async () => {
      if (normalizedInitialQuery) {
        const key = `${normalizedInitialQuery}::${initialQueryTs ?? 'na'}`;
        initialQueryKeyRef.current = key;
        setQuery(normalizedInitialQuery);
        updateRecentSearchesRef.current(normalizedInitialQuery);
        executeSearchRef.current(normalizedInitialQuery);
        navigation.setParams({ initialQuery: undefined, initialQueryTs: undefined });
        didHydrateInitialStateRef.current = true;
        return;
      }

      setSearchType('');
      setQuery('');
      executeSearchRef.current('');
      didHydrateInitialStateRef.current = true;
    })();
  });

  useEffect(() => {
    if (!didHydrateInitialStateRef.current) return;

    const initialQuery = route.params?.initialQuery;
    const initialQueryTs = route.params?.initialQueryTs;
    const normalizedInitialQuery = typeof initialQuery === 'string' ? initialQuery.trim() : '';

    if (!normalizedInitialQuery) return;

    const key = `${normalizedInitialQuery}::${initialQueryTs ?? 'na'}`;
    if (initialQueryKeyRef.current === key) return;

    initialQueryKeyRef.current = key;
    setQuery(normalizedInitialQuery);
    updateRecentSearches(normalizedInitialQuery);
    executeSearch(normalizedInitialQuery);
    navigation.setParams({ initialQuery: undefined, initialQueryTs: undefined });
  }, [route.params?.initialQuery, route.params?.initialQueryTs, navigation, executeSearch, updateRecentSearches]);

  useMountEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (autocompleteDebounceRef.current) clearTimeout(autocompleteDebounceRef.current);
    };
  });

  const handleAutocomplete = useCallback((text, { type } = {}) => {
    if (autocompleteDebounceRef.current) {
      clearTimeout(autocompleteDebounceRef.current);
      autocompleteDebounceRef.current = null;
    }
    const trimmed = text?.trim?.() ?? '';
    const normalizedType = normalizeSearchType(type ?? searchType);
    const cacheKey = buildSearchCacheKey(communityId, trimmed, normalizedType);
    if (!trimmed) {
      latestAutocompleteIdRef.current += 1;
      setAutocompleteSuggestions([]);
      setIsAutocompleteLoading(false);
      autocompleteDebounceRef.current = null;
      return;
    }

    if (autocompleteCacheRef.current.has(cacheKey)) {
      setAutocompleteSuggestions(autocompleteCacheRef.current.get(cacheKey) || []);
      setIsAutocompleteLoading(false);
      return;
    }

    setIsAutocompleteLoading(true);
    autocompleteDebounceRef.current = setTimeout(async () => {
      const requestId = ++latestAutocompleteIdRef.current;
      autocompleteDebounceRef.current = null;
      const existingRequest = autocompleteInFlightRef.current.get(cacheKey);
      try {
        const suggestions = existingRequest || fetchSearchAutocomplete(
          trimmed,
          token,
          communityId,
          normalizedType || undefined,
        );
        if (!existingRequest) {
          autocompleteInFlightRef.current.set(cacheKey, suggestions);
        }
        const resolvedSuggestions = await suggestions;
        debugLog('Autocomplete suggestions for query', trimmed, resolvedSuggestions);
        if (latestAutocompleteIdRef.current !== requestId) return;
        const sanitized = Array.isArray(resolvedSuggestions)
          ? resolvedSuggestions.filter(item => {
              const label = getSuggestionLabel(item);
              return typeof label === 'string' && label.trim().length > 0;
            })
          : [];
        autocompleteCacheRef.current.set(cacheKey, sanitized);
        setAutocompleteSuggestions(sanitized);
      } catch (error) {
        if (latestAutocompleteIdRef.current !== requestId) return;
        console.error('Autocomplete failed:', error);
        setAutocompleteSuggestions([]);
      } finally {
        autocompleteInFlightRef.current.delete(cacheKey);
        if (latestAutocompleteIdRef.current === requestId) {
          setIsAutocompleteLoading(false);
        }
      }
    }, 200);
  }, [token, getSuggestionLabel, communityId, searchType]);

  const scheduleFullSearch = useCallback((text, options = {}) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = text?.trim?.() ?? '';

    if (!trimmed) {
      debounceRef.current = setTimeout(() => {
        executeSearch('', options);
      }, 250);
      return;
    }

    if (trimmed.length < FULL_SEARCH_MIN_LENGTH) {
      debounceRef.current = null;
      return;
    }

    debounceRef.current = setTimeout(() => {
      executeSearch(text, options);
    }, FULL_SEARCH_DEBOUNCE_MS);
  }, [executeSearch]);

  const handleSearch = useCallback((text) => {
    setQuery(text);
    handleAutocomplete(text);
    scheduleFullSearch(text);
  }, [handleAutocomplete, scheduleFullSearch]);

  const handleFilterSelect = useCallback((nextType) => {
    const normalizedNextType = normalizeSearchType(nextType);
    if (normalizedNextType === searchType) return;

    setSearchType(normalizedNextType);
    latestAutocompleteIdRef.current += 1;
    setAutocompleteSuggestions([]);
    cancelAutocomplete();

    if (query.trim().length > 0) {
      handleAutocomplete(query, { type: normalizedNextType });
    }

    if (isSearchFocused) {
      scheduleFullSearch(query, { type: normalizedNextType });
      return;
    }

    executeSearch(query, { force: true, type: normalizedNextType });
  }, [
    searchType,
    cancelAutocomplete,
    executeSearch,
    handleAutocomplete,
    isSearchFocused,
    query,
    scheduleFullSearch,
  ]);

  const handleSuggestionPress = useCallback((suggestion) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    const label = getSuggestionLabel(suggestion);
    cancelAutocomplete();
    setAutocompleteSuggestions([]);
    setQuery(label);
    updateRecentSearches(label);
    inputRef.current?.blur?.();
    setIsSearchFocused(false);
    executeSearch(label);
  }, [executeSearch, getSuggestionLabel, updateRecentSearches, cancelAutocomplete]);

  const handleRecentSearchPress = useCallback((value) => {
    if (!value) return;
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    cancelAutocomplete();
    setAutocompleteSuggestions([]);
    setQuery(value);
    updateRecentSearches(value);
    inputRef.current?.blur?.();
    setIsSearchFocused(false);
    executeSearch(value);
  }, [executeSearch, updateRecentSearches, cancelAutocomplete]);

  const handleRecentSearchRemove = useCallback((value) => {
    if (!value) return;
    const target = value.toLowerCase();
    setRecentSearches(prev => {
      const next = prev.filter(entry => entry.toLowerCase() !== target);
      AsyncStorage.setItem('search_cache__recent_queries', JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const renderSuggestionItem = ({ item }) => {
    const label = getSuggestionLabel(item);
    if (!label) return null;
    const suggestionContext = getSuggestionContext(item);
    return (
      <TouchableOpacity style={styles.suggestionItem} onPress={() => handleSuggestionPress(item)} activeOpacity={0.85}>
        <View style={styles.suggestionIconWrapper}>
          <Ionicons name="search" size={20} color={themeVariables.blackColor} />
        </View>
        <View style={styles.suggestionContent}>
          <Text style={styles.suggestionTitle} numberOfLines={1}>
            {label}
          </Text>
          {suggestionContext ? (
            <Text style={styles.suggestionSubtitle} numberOfLines={2}>
              {suggestionContext}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  const shouldShowAutocomplete = autocompleteSuggestions.length > 0;
  const showSuggestionPanel = isSearchFocused;
  const showResults = !showSuggestionPanel;
  const showSearchSpinner = isLoading || (isSearchFocused && isAutocompleteLoading);
  const trimmedQuery = query.trim();
  const trimmedResultsQuery = resultsQuery.trim();
  const isShowingCommittedResults = trimmedQuery === trimmedResultsQuery && searchType === resultsType;
  const hasAnyResults = isShowingCommittedResults && results.length > 0;
  const resultSections = isShowingCommittedResults ? buildResultSections(results) : [];
  const shouldShowSectionHeaders = resultSections.length > 1 || searchType === '';

  const handleTagPress = useCallback((value) => {
    const trimmed = safeText(value)?.trim();
    if (!trimmed) return;
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    cancelAutocomplete();
    setAutocompleteSuggestions([]);
    setQuery(trimmed);
    updateRecentSearches(trimmed);
    inputRef.current?.blur?.();
    setIsSearchFocused(false);
    executeSearch(trimmed);
  }, [executeSearch, updateRecentSearches, cancelAutocomplete]);

  const getListItemProps = useCallback((item) => {
    if (!item) return null;
    const communityText = safeText(item.community);
    const normalizedDate = (value) => {
      const formatted = formatDate(value);
      return formatted ? formatted : undefined;
    };
    const onPress = () => handleCardPress(item);
    switch (item.type) {
      case 'activity':
      case 'session': {
        const title = safeText(item.title || item.name);
        const sessionStatus = safeText(item.sessionStatus || item.status).trim();
        const nextSessionCandidate = item.nextSessionDate || item.nextSession?.date || item.date;
        const formattedNextSessionDate = normalizedDate(nextSessionCandidate);
        const hasNextSessionDate = Boolean(formattedNextSessionDate);
        const hasRawNextSessionValue = (() => {
          if (nextSessionCandidate == null) return false;
          if (typeof nextSessionCandidate === 'string') return nextSessionCandidate.trim().length > 0;
          return true;
        })();
        const groupDay = safeText(item.groupDetails?.day).trim();
        const rawGroupTime = item.groupDetails?.time;
        const formattedGroupTime = formatGroupTime(rawGroupTime) || safeText(rawGroupTime).trim();
        const scheduleParts = [groupDay, formattedGroupTime].filter(Boolean);
        const subtitle = hasNextSessionDate
          ? `Next Session: ${formattedNextSessionDate}`
          : !hasRawNextSessionValue
            ? 'Next Session: TBA'
            : scheduleParts.length
              ? 'Next Session:'
              : undefined;
        const secondarySubtitle = scheduleParts.length
          ? scheduleParts.join(' • ')
          : undefined;
        return {
          imageSource: resolveImageSource(item.imageUrl),
          title: title || 'Activity',
          subtitle,
          secondarySubtitle,
          tagText: safeText(item.activityType) || 'Activity',
          sessionStatusTagText: sessionStatus || undefined,
          communityTagText: communityText || undefined,
          onPress,
          onTagPress: handleTagPress,
        };
      }
      case 'event': {
        const title = safeText(item.title);
        const subtitleParts = [safeText(item.location)];
        const rawTime = item.startTime || item.time;
        const timeField = formatEventTime(rawTime) || safeText(rawTime);
        const dayOfWeek = getDayName(item.date);
        const formattedDate = normalizedDate(item.date);
        const dateLabelParts = [];
        if (dayOfWeek) dateLabelParts.push(dayOfWeek);
        if (formattedDate) dateLabelParts.push(formattedDate);
        return {
          imageSource: resolveImageSource(item.imageUrl),
          title: title || 'Event',
          date: dateLabelParts.join(' • ') || undefined,
          time: timeField || undefined,
          subtitle: subtitleParts.filter(Boolean).join(' • ') || undefined,
          tagText: safeText(item.eventType) || 'Event',
          communityTagText: communityText || undefined,
          isEvent: true,
          onPress,
          onTagPress: handleTagPress,
        };
      }
      case 'post': {
        const thumbnails = Array.isArray(item.mediaThumbnails) ? item.mediaThumbnails : [];
        const mediaArray = Array.isArray(item.media) ? item.media : [];
        const previewUri = extractMediaUrl(thumbnails[0]) || extractMediaUrl(mediaArray[0]);
        const rawContent = safeText(item.content || item.title);
        const content = truncateText(rawContent, 80) || 'View post details';
        const authorName = [safeText(item.author?.firstName), safeText(item.author?.lastName)]
          .filter(Boolean)
          .join(' ');
        const truncatedAuthorName = truncateText(authorName, 24);
        return {
          imageSource: resolveImageSource(previewUri),
          title: content,
          subtitle: undefined,
          date: normalizedDate(item.createdAt),
          metaText: typeof item.commentCount === 'number'
            ? `Comments: ${item.commentCount}`
            : undefined,
          tagText: safeText(item.category) || 'Post',
          communityTagText: communityText || undefined,
          secondaryFooterText: truncatedAuthorName ? `By ${truncatedAuthorName}` : undefined,
          onPress,
          onTagPress: handleTagPress,
        };
      }
      case 'member':
      case 'user': {
        const title = [safeText(item.firstName), safeText(item.lastName)].filter(Boolean).join(' ').trim();
        const communityName = communityText ? `Member of ${communityText}` : '';
        const subtitleParts = [];
        const hasProfilePicture = Boolean(item.profilePicture);
        const leadingComponent = hasProfilePicture ? null : (
          <Avatar
            size={60}
            name={title || safeText(item.displayName) || safeText(item.email) || 'Member'}
            variant="beam"
            colors={['#1B263B', '#0A74DA', '#6C7A89', '#F8F9FA', '#0C0C0C']}
          />
        );
        return {
          imageSource: hasProfilePicture ? resolveImageSource(item.profilePicture) : null,
          leadingComponent,
          title: title || safeText(item.displayName) || 'Member',
          subtitle: communityName || subtitleParts.filter(Boolean).join(' • ') || undefined,
          tagText: undefined,
          communityTagText: undefined,
          onPress,
        };
      }
      default: {
        const fallbackTitle = safeText(item.title || item.name || item.displayName || item.id);
        return {
          imageSource: resolveImageSource(item.imageUrl),
          title: fallbackTitle || 'Result',
          subtitle: undefined,
          communityTagText: communityText || undefined,
          onPress,
        };
      }
    }
  }, [handleCardPress, handleTagPress]);

  const handleCancel = useCallback(() => {
    inputRef.current?.clear?.();
    inputRef.current?.blur?.();
    setIsSearchFocused(false);
    cancelAutocomplete();
    latestAutocompleteIdRef.current += 1;
    setAutocompleteSuggestions([]);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    setSearchType(resultsType);
    setQuery(resultsQuery);
  }, [cancelAutocomplete, resultsQuery, resultsType]);

  useEffect(() => {
    searchCacheRef.current.clear();
    autocompleteCacheRef.current.clear();
    searchInFlightRef.current.clear();
    autocompleteInFlightRef.current.clear();
    lastExecutedQueryRef.current = null;
    setAutocompleteSuggestions([]);
    if (didHydrateInitialStateRef.current) {
      executeSearchRef.current(committedResultsQueryRef.current, {
        force: true,
        type: committedResultsTypeRef.current,
      });
    }
  }, [communityId, token]);

  return (
    <SafeAreaView style={styles.container}>
      <SearchBar
        ref={inputRef}
        placeholder="Search..."
        value={query}
        onChangeText={handleSearch}
        onFocus={() => {
          setIsSearchFocused(true);
          handleAutocomplete(query);
        }}
        onBlur={() => {
          setIsSearchFocused(false);
          if (query.trim().length > 0) {
            updateRecentSearches(query);
          }
        }}
        onSubmitEditing={() => {
          if (debounceRef.current) {
            clearTimeout(debounceRef.current);
            debounceRef.current = null;
          }
          cancelAutocomplete();
          setAutocompleteSuggestions([]);
          inputRef.current?.blur?.();
          setIsSearchFocused(false);
          if (query.trim().length > 0) {
            updateRecentSearches(query);
          }
          executeSearch(query);
        }}
        showSpinner={showSearchSpinner}
        showCancel={isSearchFocused}
        onCancel={handleCancel}
        isFocused={isSearchFocused}
        returnKeyType="search"
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScrollContent}
        style={styles.filterScroll}
      >
        {SEARCH_FILTERS.map(filter => {
          const isActive = searchType === filter.value;
          return (
            <TouchableOpacity
              key={filter.value || 'all'}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() => handleFilterSelect(filter.value)}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      {showSuggestionPanel ? (
        <View style={styles.autocompleteContainer}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.suggestionContentContainer}
            showsVerticalScrollIndicator={false}
          >
            {shouldShowAutocomplete ? (
              <View style={styles.suggestionSection}>
                <Text style={styles.suggestionSectionTitle}>Suggested Searches</Text>
                {autocompleteSuggestions.map((item, index) => (
                  <View key={suggestionKeyExtractor(item, index)}>
                    {renderSuggestionItem({ item })}
                  </View>
                ))}
              </View>
            ) : null}
            {recentSearches.length > 0 ? (
              <View style={styles.suggestionSection}>
                <Text style={styles.suggestionSectionTitle}>Recent Searches</Text>
                {recentSearches.map(value => (
                  <TouchableOpacity
                    key={value}
                    style={[styles.suggestionItem, styles.recentSuggestionItem]}
                    onPress={() => handleRecentSearchPress(value)}
                    activeOpacity={0.85}
                  >
                    <View style={[styles.suggestionIconWrapper, styles.recentIconWrapper]}>
                      <Ionicons name="time-outline" size={20} color={themeVariables.blackColor} />
                    </View>
                    <View style={styles.suggestionContent}>
                      <Text style={styles.suggestionTitle} numberOfLines={1}>
                        {value}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.recentRemoveButton}
                      onPress={(event) => {
                        event.stopPropagation?.();
                        handleRecentSearchRemove(value);
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      activeOpacity={0.6}
                    >
                      <Ionicons name="close" size={18} color={themeVariables.blackColor} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
          </ScrollView>
        </View>
      ) : null}
      {showResults ? (
        <ScrollView
          contentContainerStyle={styles.resultsContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.resultsList}>
            {resultSections.map(section => (
              <View key={section.key} style={styles.resultSection}>
                {shouldShowSectionHeaders ? (
                  <View style={styles.resultSectionHeader}>
                    <Text style={styles.resultSectionTitle}>{section.title}</Text>
                    <Text style={styles.resultSectionCount}>{section.items.length}</Text>
                  </View>
                ) : null}
                {section.items.map((item, index) => {
                  const key = item.id || item._id || `${section.key}-${index}`;
                  const listItemProps = getListItemProps(item);
                  if (!listItemProps) return null;
                  return (
                    <View key={key} style={styles.resultItem}>
                      <SearchItem {...listItemProps} />
                    </View>
                  );
                })}
              </View>
            ))}
          </View>

          {!isShowingCommittedResults && trimmedQuery.length > 0 && !isLoading ? (
            <Text style={styles.emptyTextOverall}>
              Keep typing for suggestions, or press search to see full results.
            </Text>
          ) : null}

          {isShowingCommittedResults && !hasAnyResults && trimmedQuery.length > 0 ? (
            <Text style={styles.emptyTextOverall}>No results match this search.</Text>
          ) : null}

          {isShowingCommittedResults && !hasAnyResults && trimmedQuery.length === 0 ? (
            <Text style={styles.emptyTextOverall}>
              Start typing to search for activities, events, members, or posts.
            </Text>
          ) : null}
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 0,
    backgroundColor: themeVariables.screenBackgroundColor,
  },
  filterScroll: {
    marginBottom: 12,
    flexGrow: 0,
  },
  filterScrollContent: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignItems: 'center',
  },
  filterChip: {
    minHeight: 42,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: themeVariables.whiteColor,
    borderWidth: 1,
    borderColor: '#d7d7d7',
    marginRight: 10,
    justifyContent: 'center',
    alignSelf: 'center',
  },
  filterChipActive: {
    backgroundColor: themeVariables.primaryColor,
    borderColor: themeVariables.primaryColor,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: themeVariables.blackColor,
  },
  filterChipTextActive: {
    color: themeVariables.whiteColor,
  },
  autocompleteContainer: {
    marginHorizontal: 8,
    marginBottom: 12,
    borderRadius: 0,
  },
  suggestionContentContainer: {
    paddingVertical: 8,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 8,
    marginVertical: 6,
    backgroundColor: 'transparent',
    borderRadius: 0,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: themeVariables.lightGreyColor,
  },
  recentSuggestionItem: {
    marginHorizontal: 8,
  },
  suggestionIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: themeVariables.lightGreyColor,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: themeVariables.blackColor,
  },
  suggestionSubtitle: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 16,
    color: '#555',
  },
  suggestionSection: {
    marginBottom: 12,
  },
  suggestionSectionTitle: {
    marginHorizontal: 8,
    marginBottom: 4,
    fontSize: 14,
    fontWeight: '600',
    color: themeVariables.blackColor,
  },
  recentIconWrapper: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  recentRemoveButton: {
    marginLeft: 12,
  },
  emptyTextOverall: {
    textAlign: 'center',
    marginTop: 24,
    color: themeVariables.blackColor,
    paddingHorizontal: 16,
  },
  resultsContent: {
    paddingBottom: 0,
  },
  resultsList: {
    paddingHorizontal: 0,
  },
  resultSection: {
    marginBottom: 10,
  },
  resultSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  resultSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: themeVariables.blackColor,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  resultSectionCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  resultItem: {
    marginBottom: 8,
  },
});

export default Search;

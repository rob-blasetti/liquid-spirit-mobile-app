import React, { useState, useContext, useEffect, useRef, useCallback } from 'react';
import { SafeAreaView, View, TextInput, FlatList, Text, StyleSheet, Dimensions, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import themeVariables from '../styles/theme';
import { UserContext } from '../contexts/UserContext';
import { fetchSearchResults, fetchSearchAutocomplete } from '../services/SearchService';
import SearchCard from '../components/SearchCard';
import { TabView } from 'react-native-tab-view';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Search = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasPrefilled, setHasPrefilled] = useState(false);
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState([]);
  const [isAutocompleteLoading, setIsAutocompleteLoading] = useState(false);
  const { token } = useContext(UserContext);
  // TabView state for result categories
  const [searchIndex, setSearchIndex] = useState(0);
  const [searchRoutes] = useState([
    { key: 'activities', title: 'Activities' },
    { key: 'events', title: 'Events' },
    { key: 'posts', title: 'Posts' },
    { key: 'users', title: 'Users' },
  ]);
  const debounceRef = useRef(null);
  const autocompleteDebounceRef = useRef(null);
  // Handler for card press navigation
  const handleCardPress = (selected) => {
    if (selected.type === 'member' || selected.type === 'user') {
      navigation.navigate('PublicUserProfile', { userId: selected._id || selected.id });
    } else if (selected.type === 'session') {
      navigation.navigate('ActivityDetailCard', { activityId: selected.activityId });
    } else if (selected.type === 'activity') {
      navigation.navigate('ActivityDetailCard', { activityId: selected._id || selected.id });
    } else if (selected.type === 'event') {
      navigation.navigate('EventDetailCard', { eventId: selected._id || selected.id });
    }
  };
  // Partition results by type for tabs
  const activitiesResults = results.filter(item => item.type === 'activity' || item.type === 'session');
  const eventsResults = results.filter(item => item.type === 'event');
  const postsResults = results.filter(item => item.type === 'post');
  const usersResults = results.filter(item => item.type === 'member' || item.type === 'user');
  // Render each tab scene
  const renderScene = ({ route }) => {
    let data = [];
    switch (route.key) {
      case 'activities': data = activitiesResults; break;
      case 'events': data = eventsResults; break;
      case 'posts': data = postsResults; break;
      case 'users': data = usersResults; break;
      default: data = [];
    }
    return (
      <FlatList
        data={data}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        keyExtractor={(item, index) => (item.id || item._id ? (item.id || item._id).toString() : index.toString())}
        renderItem={({ item }) => (
          <SearchCard item={item} onPress={handleCardPress} />
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {query.length === 0 ? 'No recent results available.' : `No ${route.title} found`}
          </Text>
        }
      />
    );
  };

  // Custom TabBar: inactive tabs have black bottom border/text, active tab with primary color underline and text
  const renderSearchTabBar = ({ navigationState, jumpTo, layout }) => {
    const totalWidth = layout?.width ?? Dimensions.get('window').width;
    const tabWidth = totalWidth / navigationState.routes.length;
    return (
      <View style={{
          flexDirection: 'row',
          backgroundColor: themeVariables.darkGreyColor,
        }}>
        {navigationState.routes.map((route, idx) => {
          const focused = navigationState.index === idx;
          return (
            <TouchableOpacity
              key={route.key}
              style={{
                width: tabWidth,
                paddingVertical: 8,
                alignItems: 'center',
                justifyContent: 'center',
                // static bottom border thickness, color depends on focus
                borderBottomWidth: focused ? 2 : 0,
                borderBottomColor: focused ? themeVariables.primaryColor : themeVariables.blackColor,
                // rounded bottom corners on active tab
                // borderBottomLeftRadius: focused ? 6 : 0,
                // borderBottomRightRadius: focused ? 6 : 0,
              }}
              onPress={() => jumpTo(route.key)}
            >
              <Text style={{
                  color: focused ? themeVariables.primaryColor : themeVariables.blackColor,
                  fontSize: 16,
                  fontWeight: focused ? 'bold' : 'normal',
                }}>
                {route.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const getSuggestionLabel = useCallback((suggestion) => {
    if (!suggestion) return '';
    if (typeof suggestion === 'string') return suggestion;
    return suggestion.label || suggestion.name || suggestion.title || suggestion.displayName || suggestion.query || '';
  }, []);

  const getSuggestionType = useCallback((suggestion) => {
    if (!suggestion || typeof suggestion === 'string') return '';
    const rawType = suggestion.type || suggestion.category || suggestion.group;
    if (!rawType || typeof rawType !== 'string') return '';
    return `${rawType.charAt(0).toUpperCase()}${rawType.slice(1)}`;
  }, []);

  const suggestionKeyExtractor = useCallback((item, index) => {
    const key = typeof item === 'string'
      ? item
      : item.id || item._id || item.value || item.slug || getSuggestionLabel(item);
    return key ? key.toString() : index.toString();
  }, [getSuggestionLabel]);

  const executeSearch = useCallback(async (text) => {
    setIsLoading(true);
    try {
      const data = await fetchSearchResults(text, token);
      setResults(data || []);
      try {
        await AsyncStorage.setItem('search_cache__query', text || '');
        await AsyncStorage.setItem('search_cache__results', JSON.stringify(data || []));
      } catch (_) {}
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // Fetch recent results on first mount, and handle initialQuery param once
  const firstMountRef = React.useRef(true);
  useEffect(() => {
    if (firstMountRef.current && !hasPrefilled) {
      (async () => {
        try {
          const [q, r] = await AsyncStorage.multiGet(['search_cache__query', 'search_cache__results']);
          const cachedQuery = q?.[1] ?? '';
          const cachedResults = r?.[1] ? JSON.parse(r[1]) : [];
          if (Array.isArray(cachedResults) && cachedResults.length > 0) {
            setQuery(cachedQuery);
            setResults(cachedResults);
            setHasPrefilled(true);
          }
        } catch (_) {}
      })();
    }

    const initialQuery = route.params?.initialQuery;
    if (initialQuery) {
      setQuery(initialQuery);
      executeSearch(initialQuery);
      navigation.setParams({ initialQuery: undefined });
      firstMountRef.current = false;
    } else if (firstMountRef.current) {
      executeSearch('');
      firstMountRef.current = false;
    }
  }, [route.params?.initialQuery, navigation, executeSearch, hasPrefilled]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (autocompleteDebounceRef.current) clearTimeout(autocompleteDebounceRef.current);
    };
  }, []);

  const handleAutocomplete = useCallback((text) => {
    if (autocompleteDebounceRef.current) {
      clearTimeout(autocompleteDebounceRef.current);
    }
    const trimmed = text?.trim?.() ?? '';
    if (!trimmed) {
      setAutocompleteSuggestions([]);
      setIsAutocompleteLoading(false);
      return;
    }
    setIsAutocompleteLoading(true);
    autocompleteDebounceRef.current = setTimeout(async () => {
      try {
        const suggestions = await fetchSearchAutocomplete(trimmed, token);
        const sanitized = Array.isArray(suggestions)
          ? suggestions.filter(item => {
              const label = getSuggestionLabel(item);
              return typeof label === 'string' && label.trim().length > 0;
            })
          : [];
        setAutocompleteSuggestions(sanitized);
      } catch (error) {
        console.error('Autocomplete failed:', error);
        setAutocompleteSuggestions([]);
      } finally {
        setIsAutocompleteLoading(false);
      }
    }, 200);
  }, [token, getSuggestionLabel]);

  const handleSearch = useCallback((text) => {
    setQuery(text);
    handleAutocomplete(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      executeSearch(text);
    }, 300);
  }, [executeSearch, handleAutocomplete]);

  const handleSuggestionPress = useCallback((suggestion) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    const label = getSuggestionLabel(suggestion);
    setAutocompleteSuggestions([]);
    setIsAutocompleteLoading(false);
    setQuery(label);
    executeSearch(label);
  }, [executeSearch, getSuggestionLabel]);

  const renderSuggestionItem = ({ item }) => {
    const label = getSuggestionLabel(item);
    if (!label) return null;
    const typeLabel = getSuggestionType(item);
    return (
      <TouchableOpacity style={styles.autocompleteItem} onPress={() => handleSuggestionPress(item)}>
        <Text style={styles.autocompleteText}>{label}</Text>
        {typeLabel ? <Text style={styles.autocompleteTypeText}>{typeLabel}</Text> : null}
      </TouchableOpacity>
    );
  };

  const shouldShowAutocomplete = query.trim().length > 0 && (isAutocompleteLoading || autocompleteSuggestions.length > 0);

  const LoadingBanner = () => (
    isLoading ? (
      <View style={styles.loadingBanner}>
        <ActivityIndicator size="small" color={themeVariables.primaryColor} />
        <Text style={styles.loadingText}>Updating results…</Text>
      </View>
    ) : null
  );

  return (
    <SafeAreaView style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search..."
        value={query}
        onChangeText={handleSearch}
        onFocus={() => handleAutocomplete(query)}
      />
      {shouldShowAutocomplete ? (
        <View style={styles.autocompleteContainer}>
          {isAutocompleteLoading ? (
            <View style={styles.autocompleteLoadingContainer}>
              <ActivityIndicator size="small" color={themeVariables.primaryColor} />
              <Text style={styles.autocompleteLoadingText}>Searching suggestions…</Text>
            </View>
          ) : (
            <FlatList
              data={autocompleteSuggestions}
              keyExtractor={suggestionKeyExtractor}
              renderItem={renderSuggestionItem}
              keyboardShouldPersistTaps="handled"
              ItemSeparatorComponent={() => <View style={styles.autocompleteSeparator} />}
            />
          )}
        </View>
      ) : null}
      <LoadingBanner />
      <View style={{ flex: 1 }}>
        <TabView
          navigationState={{ index: searchIndex, routes: searchRoutes }}
          renderScene={renderScene}
          onIndexChange={setSearchIndex}
          initialLayout={{ width: Dimensions.get('window').width }}
          renderTabBar={renderSearchTabBar}
          sceneContainerStyle={{ backgroundColor: themeVariables.darkGreyColor }}
          style={{ backgroundColor: themeVariables.darkGreyColor }}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    marginBottom: 80,
    backgroundColor: themeVariables.darkGreyColor,
  },
  searchInput: {
    // Indent and padded search bar
    height: 48,
    marginHorizontal: 8,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderColor: themeVariables.blackColor,
    borderWidth: 1,
    borderRadius: 20,
    // Optionally, add a subtle background for contrast
    backgroundColor: themeVariables.whiteColor,
  },
  autocompleteContainer: {
    marginHorizontal: 8,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: themeVariables.lightGreyColor,
    backgroundColor: themeVariables.whiteColor,
    maxHeight: 220,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  autocompleteLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  autocompleteLoadingText: {
    color: themeVariables.blackColor,
    marginLeft: 8,
  },
  autocompleteSeparator: {
    height: 1,
    backgroundColor: themeVariables.lightGreyColor,
  },
  autocompleteItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  autocompleteText: {
    color: themeVariables.blackColor,
    fontSize: 16,
  },
  autocompleteTypeText: {
    marginTop: 4,
    color: 'rgba(0, 0, 0, 0.6)',
    fontSize: 12,
  },
  placeholderContainer: {
    alignItems: 'center',
    marginTop: 32,
  },
  placeholderText: {
    color: themeVariables.blackColor,
  },
  loadingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  loadingText: {
    color: themeVariables.blackColor,
    marginLeft: 8,
  },
  resultItem: {
    paddingVertical: 8,
    borderBottomColor: themeVariables.lightGreyColor,
    borderBottomWidth: 1,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 16,
    color: themeVariables.blackColor,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
});

export default Search;

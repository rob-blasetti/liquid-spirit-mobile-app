import React, { useState, useContext, useEffect } from 'react';
import { SafeAreaView, View, TextInput, FlatList, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import themeVariables from '../styles/theme';
import { UserContext } from '../contexts/UserContext';
import { fetchSearchResults } from '../services/SearchService';
import SearchCard from '../components/SearchCard';
import { TabView } from 'react-native-tab-view';

const Search = () => {
  const navigation = useNavigation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { token } = useContext(UserContext);
  // TabView state for result categories
  const [searchIndex, setSearchIndex] = useState(0);
  const [searchRoutes] = useState([
    { key: 'activities', title: 'Activities' },
    { key: 'events', title: 'Events' },
    { key: 'posts', title: 'Posts' },
    { key: 'users', title: 'Users' },
  ]);
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
          backgroundColor: themeVariables.greyColor,
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
                borderBottomWidth: 2,
                borderBottomColor: focused ? themeVariables.primaryColor : themeVariables.blackColor,
                // rounded bottom corners on active tab
                borderBottomLeftRadius: focused ? 6 : 0,
                borderBottomRightRadius: focused ? 6 : 0,
              }}
              onPress={() => jumpTo(route.key)}
            >
              <Text style={{
                  color: focused ? themeVariables.primaryColor : themeVariables.blackColor,
                  fontSize: 14,
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

  // Fetch recent results on mount (when no query)
  useEffect(() => {
    const loadRecent = async () => {
      setIsLoading(true);
      try {
        // Fetch initial results with an empty query to show recent items when the screen loads
        const data = await fetchSearchResults('', token);
        setResults(data || []);
      } catch (err) {
        console.error('Failed to load recent results:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadRecent();
  }, [token]);
  
  const handleSearch = async (text) => {
    setQuery(text);
    setIsLoading(true);
    try {
      const data = await fetchSearchResults(text, token);
      console.log('Search results:', data);
      setResults(data || []);
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search..."
        value={query}
        onChangeText={handleSearch}
      />
      {isLoading ? (
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderText}>Loading...</Text>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <TabView
            navigationState={{ index: searchIndex, routes: searchRoutes }}
            renderScene={renderScene}
            onIndexChange={setSearchIndex}
            initialLayout={{ width: Dimensions.get('window').width }}
            renderTabBar={renderSearchTabBar}
            sceneContainerStyle={{ backgroundColor: themeVariables.greyColor }}
            style={{ backgroundColor: themeVariables.greyColor }}
          />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: themeVariables.greyColor,
  },
  searchInput: {
    // Indent and padded search bar
    height: 48,
    marginHorizontal: 8,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderColor: themeVariables.primaryCo,  
    borderWidth: 1,
    borderRadius: 20,
    // Optionally, add a subtle background for contrast
    backgroundColor: themeVariables.whiteColor,
  },
  placeholderContainer: {
    alignItems: 'center',
    marginTop: 32,
  },
  placeholderText: {
    color: themeVariables.greyColor,
  },
  resultItem: {
    paddingVertical: 8,
    borderBottomColor: themeVariables.lightGreyColor,
    borderBottomWidth: 1,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 16,
    color: themeVariables.greyColor,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
});

export default Search;
import React, { useState, useContext, useEffect } from 'react';
import { SafeAreaView, View, TextInput, FlatList, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import themeVariables from '../styles/theme';
import { UserContext } from '../contexts/UserContext';
import { fetchSearchResults } from '../services/SearchService';
import SearchCard from '../components/SearchCard';

const Search = () => {
  const navigation = useNavigation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { token } = useContext(UserContext);

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
        <FlatList
          data={results}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          keyExtractor={(item, index) => (item.id || item._id ? (item.id || item._id).toString() : index.toString())}
          renderItem={({ item }) => (
            <SearchCard
              item={item}
              onPress={(selected) => {
                if (selected.type === 'member' || selected.type === 'user') {
                  navigation.navigate('PublicUserProfile', { userId: selected._id || selected.id });
                } else if (selected.type === 'session') {
                  // Navigate to the parent activity detail for this session
                  navigation.navigate('ActivityDetailCard', { activityId: selected.activityId });
                } else if (selected.type === 'activity') {
                  navigation.navigate('ActivityDetailCard', { activityId: selected._id || selected.id });
                } else if (selected.type === 'event') {
                  navigation.navigate('EventDetailCard', { eventId: selected._id || selected.id });
                }
              }}
            />
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {query.length === 0
                ? 'No recent results available.'
                : 'No results found'}
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: themeVariables.whiteColor,
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
    backgroundColor: themeVariables.lightGreyColor,
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
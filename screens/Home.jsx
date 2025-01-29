import React, { useContext } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
} from 'react-native';
import themeVariables from '../styles/theme';
import { UserContext } from '../contexts/UserContext';

const Home = ({ navigation }) => {
  const { user } = useContext(UserContext);

  const upcomingEvents = [
    {
      id: 1,
      name: 'Community Devotional',
      date: '2025-01-25',
      location: 'Bahá’í Center, Banyule',
      description: 'Join us for a peaceful devotional gathering to strengthen our spiritual connections.',
      image: 'https://example.com/devotional.jpg',
    },
    {
      id: 2,
      name: 'Study Circle',
      date: '2025-01-28',
      location: '123 Banyule St, VIC',
      description: 'Participate in a study circle focused on community building and personal growth.',
      image: 'https://example.com/study-circle.jpg',
    }
  ];

  const upcomingActivities = [
    { id: 1, name: 'Youth Gathering', date: '2025-02-01' },
    { id: 2, name: 'Children’s Class', date: '2025-02-03' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollView}>
        {/* Banner Section */}
        <View style={styles.bannerContainer}>
          <Image
            source={{ uri: user?.community?.bannerImage }}
            style={styles.bannerImage}
            resizeMode="cover"
          />
          <Text style={styles.communityName}>{user?.community?.name}</Text>
        </View>

        {/* Profile Section */}
        <View style={styles.profileSection}>
          <Image
            source={{ uri: user?.profilePicture }}
            style={styles.profilePicture}
          />
          <Text style={styles.profileName}>
            {user?.firstName} {user?.lastName}
          </Text>
          <Text style={styles.profileRole}>
            {user?.roles?.join(', ')} | {user?.occupation}
          </Text>
        </View>

        {/* Upcoming Events Section */}
        <View style={styles.upcomingSection}>
          <Text style={styles.sectionTitle}>Upcoming Events</Text>
          {upcomingEvents.map((event) => (
            <TouchableOpacity
              key={event.id}
              style={styles.upcomingItem}
              onPress={() => navigation.navigate('EventDetail', { event })}
            >
              <Text style={styles.upcomingName}>{event.name}</Text>
              <Text style={styles.upcomingDate}>{event.date}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Upcoming Activities Section */}
        <View style={styles.upcomingSection}>
          <Text style={styles.sectionTitle}>Upcoming Activities</Text>
          {upcomingActivities.map((activity) => (
            <TouchableOpacity
              key={activity.id}
              style={styles.upcomingItem}
              onPress={() => navigation.navigate('ActivityDetail', { activity })}
            >
              <Text style={styles.upcomingName}>{activity.name}</Text>
              <Text style={styles.upcomingDate}>{activity.date}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeVariables.whiteColor, // Background color
  },
  scrollView: {
    flexGrow: 1,
  },
  bannerContainer: {
    position: 'relative',
    height: 200,
    marginBottom: 20,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  communityName: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    fontSize: 24,
    fontWeight: 'bold',
    color: themeVariables.whiteColor,
    textShadowColor: themeVariables.blackColor,
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  profileSection: {
    alignItems: 'center',
    marginVertical: 20,
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: themeVariables.blackColor,
  },
  profileRole: {
    fontSize: 16,
    color: themeVariables.greyColor,
  },
  mainSection: {
    padding: 20,
  },
  button: {
    backgroundColor: themeVariables.primaryColor,
    padding: 15,
    borderRadius: 8,
    marginVertical: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: themeVariables.whiteColor,
    fontSize: 18,
    fontWeight: '600',
  },
  upcomingSection: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: themeVariables.blackColor,
  },
  upcomingItem: {
    backgroundColor: themeVariables.lightGreyColor,
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  upcomingName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: themeVariables.blackColor,
  },
  upcomingDate: {
    fontSize: 14,
    color: themeVariables.greyColor,
  },
});

export default Home;

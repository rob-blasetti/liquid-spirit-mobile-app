import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ImageBackground,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
  Share,
} from 'react-native';
import { TabView, TabBar } from 'react-native-tab-view';
import { UserContext } from '../contexts/UserContext';
import { useAuthService } from '../services/AuthService';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faCogs, faShareAlt } from '@fortawesome/free-solid-svg-icons';
import { launchImageLibrary } from 'react-native-image-picker';
import FastImage from 'react-native-fast-image';
import s3 from '../awsConfig';

const ProfileScreen = ({ navigation }) => {
  const { user, userPosts, userActivities, userEvents, isLoading, setUser, logout } = useContext(UserContext);
  const { updateMe } = useAuthService();

  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'posts', title: 'My Posts' },
    { key: 'activities', title: 'My Activities' },
    { key: 'events', title: 'My Events' },
  ]);

  const [posts, setPosts] = useState([]);
  const [activities, setActivities] = useState([]);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    setPosts(userPosts || []);
    setActivities(userActivities || []);
    if (userEvents && user?.id) {
      setEvents(filterUserEvents(userEvents, user.id));
    } else {
      setEvents([]);
    }
  }, [userPosts, userActivities, userEvents, user?.id]);

  const filterUserEvents = (eventsData, userId) => {
    return eventsData?.filter(
      event => event.attendees && event.attendees.some(attendee => attendee.refId === userId)
    );
  };

  const handleProfilePicturePress = async () => {
    const options = {
      mediaType: 'photo',
      maxWidth: 1024,
      maxHeight: 1024,
      quality: 0.8,
    };

    launchImageLibrary(options, async response => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        console.error('ImagePicker Error: ', response.errorMessage);
      } else if (response.assets && response.assets.length > 0) {
        const asset = response.assets[0];
        const { uri, fileName, type } = asset;

        try {
          const imageBlob = await getBlob(uri);

          const s3Key = `profile-images/${fileName || Date.now()}`;
          const params = {
            Bucket: 'liquid-spirit',
            Key: s3Key,
            Body: imageBlob,
            ContentType: type || 'image/jpeg',
          };
          const s3Upload = await s3.upload(params).promise();
          console.log('S3 upload success =>', s3Upload.Location);

          const updatedUserFields = {
            ...user,
            profilePicture: s3Upload.Location,
          };

          const { ok, data } = await updateMe(updatedUserFields);
          if (!ok) {
            console.log('Error updating user profile:', data);
            alert('Failed to update profile on the server.');
            return;
          }

          setUser(data); 

        } catch (err) {
          console.error('Error uploading to S3 =>', err);
        }
      }
    });
  };

  const getBlob = async (uri) => {
    const response = await fetch(uri);
    return await response.blob();
  };

  const renderList = (data, type) => {
    if (isLoading) {
      return <ActivityIndicator size="large" color="#312783" />;
    }
    if (!data.length) {
      return <Text style={styles.noDataText}>No {type} available.</Text>;
    }

    return (
      <FlatList
        data={data}
        keyExtractor={(item, index) =>
          item._id ? item._id.toString() : index.toString()
        }
        renderItem={({ item }) => {
          let rawDate;
          if (type === 'events') rawDate = item.date || item.startTime;
          else if (type === 'activities') rawDate = item.startDate || item.createdAt;
          else if (type === 'posts') rawDate = item.createdAt || item.updatedAt;

          let formattedDate = rawDate
            ? new Date(rawDate).toLocaleDateString()
            : 'N/A';

          return (
            <View style={styles.listItem}>
              <Text style={styles.listTitle}>{item.title || item.name}</Text>
              <Text style={styles.listDate}>{formattedDate}</Text>
            </View>
          );
        }}
      />
    );
  };

  const renderScene = ({ route }) => {
    switch (route.key) {
      case 'posts':
        return renderList(posts, 'posts');
      case 'activities':
        return renderList(activities, 'activities');
      case 'events':
        return renderList(events, 'events');
      default:
        return null;
    }
  };

  const handleShareProfile = async () => {
    try {
      const message = `Check out ${user?.firstName} ${user?.lastName}'s profile in our community!`;
      await Share.share({ message });
    } catch (error) {
      console.error('Error sharing profile:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.bannerContainer}>
        <ImageBackground
          source={{
            uri: user?.community?.bannerImage || 'https://via.placeholder.com/600x200',
          }}
          style={styles.banner}
          imageStyle={styles.bannerImage}
        >
          <View style={styles.overlay} />
          <View style={styles.bannerContent}>
            <View style={styles.bannerLeft}>
              <TouchableOpacity onPress={handleProfilePicturePress}>
                <FastImage
                  style={styles.profilePicture}
                  source={{ uri: user?.profilePicture }}
                  resizeMode={FastImage.resizeMode.cover}
                />
              </TouchableOpacity>
              <Text style={styles.name}>{user?.firstName} {user?.lastName}</Text>
              <Text style={styles.bahaiID}>{user?.bahaiId}</Text>
            </View>
            <View style={styles.bannerRight}>
              <Text style={styles.communityName}>{user?.community?.name}</Text>
              <Text style={styles.memberCount}>144 members</Text>
            </View>
          </View>
        </ImageBackground>
      </View>

      {/* Profile Actions Section */}
      <View style={styles.profileActionsContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Settings')}>
          <FontAwesomeIcon icon={faCogs} size={20} color="#312783" />
          <Text style={styles.actionText}>Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleShareProfile}>
          <FontAwesomeIcon icon={faShareAlt} size={20} color="#312783" />
          <Text style={styles.actionText}>Share Profile</Text>
        </TouchableOpacity>
      </View>

      <TabView
        navigationState={{ index, routes }}
        renderScene={({ route }) => {
          switch (route.key) {
            case 'posts':
              return <Text style={styles.placeholderText}>My Posts</Text>;
            case 'activities':
              return <Text style={styles.placeholderText}>My Activities</Text>;
            case 'events':
              return <Text style={styles.placeholderText}>My Events</Text>;
            default:
              return null;
          }
        }}
        onIndexChange={setIndex}
        initialLayout={{ width: Dimensions.get('window').width }}
        renderTabBar={props => (
          <TabBar
            {...props}
            indicatorStyle={{ backgroundColor: '#312783' }}
            style={{ backgroundColor: '#312783' }}
            labelStyle={{ color: '#fff' }}
          />
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  bannerContainer: { width: '100%', height: 200 },
  banner: { flex: 1, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  bannerImage: { resizeMode: 'cover' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  bannerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, width: '100%' },
  bannerLeft: { alignItems: 'center' },
  profilePicture: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: '#fff', marginBottom: 8 },
  name: { fontSize: 20, fontWeight: 'bold', color: '#fff', textAlign: 'center' },
  bahaiID: { fontSize: 14, color: '#fff', textAlign: 'center' },
  bannerRight: { alignItems: 'flex-end' },
  communityName: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  memberCount: { fontSize: 14, color: '#ddd' },

  // Profile Actions Section
  profileActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
    marginBottom: 10,
    paddingHorizontal: 15,
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 25,
    elevation: 2,
    flexDirection: 'row',
  },
  actionText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#312783',
  },
  placeholderText: { textAlign: 'center', padding: 20, fontSize: 16, color: '#999' },
});

export default ProfileScreen;

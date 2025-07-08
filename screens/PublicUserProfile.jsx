import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Linking, Dimensions } from 'react-native';
import FastImage from 'react-native-fast-image';
import Avatar from '@flipxyz/react-native-boring-avatars';
import { useRoute, useNavigation } from '@react-navigation/native';
import { TabView, TabBar } from 'react-native-tab-view';
import { UserContext } from '../contexts/UserContext';
import { fetchUserById } from '../services/UserService';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Tooltip } from 'react-native-elements';
import { Chip } from 'react-native-paper';
import PostGallery from '../components/PostGallery';
import CertificationsList from '../components/CertificationsList';

const PublicUserProfile = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { token } = useContext(UserContext);
  const { userId } = route.params || {};
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId || !token) return;
    setLoading(true);
    fetchUserById(userId, token)
      .then(data => {
        console.log('User data:', data);
        setUserData(data);
        setError(null);
      })
      .catch(err => setError(err.message || 'Failed to load user'))
      .finally(() => setLoading(false));
  }, [userId, token]);

  // TabView state (always defined to keep hooks order stable)
  const layout = Dimensions.get('window');
  const [tabIndex, setTabIndex] = useState(0);
  const [routes] = useState([
    { key: 'posts', title: 'Posts' },
    { key: 'activities', title: 'Activities' },
    { key: 'events', title: 'Events' },
  ]);
  const renderScene = ({ route }) => {
    switch (route.key) {
      case 'posts':
        return <PostGallery posts={userData.posts || []} refreshing={false} onRefresh={() => {}} />;
      case 'activities':
        return <PostGallery posts={userData.activities || []} refreshing={false} onRefresh={() => {}} />;
      case 'events':
        return <PostGallery posts={userData.events || []} refreshing={false} onRefresh={() => {}} />;
      default:
        return null;
    }
  };
  const renderTabBarCustom = props => (
    <TabBar
      {...props}
      indicatorStyle={{ backgroundColor: '#312783' }}
      style={{ backgroundColor: '#fff' }}
      labelStyle={{ color: '#312783', fontWeight: '600' }}
      activeColor="#312783"
      inactiveColor="gray"
    />
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }
  if (!userData) {
    return null;
  }

  const { firstName, lastName, profilePicture, bio } = userData.user;
  const communityName = userData.user.community?.name;
  const preferredLang = userData.user.preferredLanguage || userData.user.language;
  const social = userData.user.socialMedia || userData.user.social || {};
  const certData = userData.certifications || {};
  const eventsCount = Array.isArray(userData.events) ? userData.events.length : 0;
  // Build certifications list
  const certs = [];
  if (certData.isVerified) certs.push('Verified User');
  if (certData.hasChildProtection) certs.push('Child Protection');
  if (certData.isLocalAssemblyMember) certs.push('LSA Member');

  // certification badges definitions using Ionicons
  const badgeDefs = [
    { flag: certData.isVerified, icon: 'checkmark', color: '#3e8e41', label: 'Verified User' },
    { flag: certData.hasChildProtection, icon: 'shield-checkmark', color: '#d81b60', label: 'Child Protection' },
    { flag: certData.isLocalAssemblyMember, icon: 'star', color: '#b71c1c', label: 'LSA Member' },
  ];
  const postsCount = Array.isArray(userData.posts) ? userData.posts.length : 0;
  const activitiesCount = Array.isArray(userData.activities) ? userData.activities.length : 0;
  return (
    <View style={styles.flexContainer}>
      <View contentContainerStyle={styles.container} scrollEnabled={false}>
      <View style={styles.header}>
        {profilePicture ? (
          <FastImage
            style={styles.avatar}
            source={{ uri: profilePicture }}
            resizeMode={FastImage.resizeMode.cover}
          />
        ) : (
          <Avatar
            size={100}
            name={`${firstName || ''} ${lastName || ''}`.trim()}
            variant="beam"
            colors={['#1B263B', '#0A74DA', '#6C7A89', '#F8F9FA', '#0C0C0C']}
            style={styles.avatar}
          />
        )}
        <Text style={styles.name}>{firstName} {lastName}</Text>
        {/* Certifications badges */}
        <CertificationsList
          items={badgeDefs
            .filter(b => b.flag)
            .map(b => ({ label: b.label, icon: b.icon, color: b.color }))
          }
        />
        {/* Community Chip in header top-right */}
        {communityName ? (
          <Chip
            icon={({ size, color }) => <Ionicons name="leaf-outline" size={size} color={color} />}
            mode="outlined"
            style={styles.communityChip}
          >
            {communityName}
          </Chip>
        ) : null}
      </View>
      {bio ? <Text style={styles.bio}>{bio}</Text> : null}
      {/* Social links */}
      {Object.entries(social).length > 0 && (
        <View style={styles.socialRow}>
          {social.facebook && (
            <TouchableOpacity onPress={() => Linking.openURL(social.facebook)} style={styles.socialButton}>
              <Ionicons name="logo-facebook" size={28} color="#fff" />
            </TouchableOpacity>
          )}
          {social.instagram && (
            <TouchableOpacity onPress={() => Linking.openURL(social.instagram)} style={styles.socialButton}>
              <Ionicons name="logo-instagram" size={28} color="#fff" />
            </TouchableOpacity>
          )}
          {social.x && (
            <TouchableOpacity onPress={() => Linking.openURL(social.x)} style={styles.socialButton}>
              <Ionicons name="logo-twitter" size={28} color="#fff" />
            </TouchableOpacity>
          )}
          {social.linkedin && (
            <TouchableOpacity onPress={() => Linking.openURL(social.linkedin)} style={styles.socialButton}>
              <Ionicons name="logo-linkedin" size={28} color="#fff" />
            </TouchableOpacity>
          )}
          {social.tiktok && (
            <TouchableOpacity onPress={() => Linking.openURL(social.tiktok)} style={styles.socialButton}>
              <Ionicons name="logo-tiktok" size={28} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      )}
      </View>
      <TabView
        navigationState={{ index: tabIndex, routes }}
        renderScene={renderScene}
        renderTabBar={renderTabBarCustom}
        onIndexChange={setTabIndex}
        initialLayout={{ width: layout.width }}
        style={styles.tabView}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  // Container padding for header content; bottom padding reduced to minimize space before tabs
  container: { padding: 16, paddingBottom: 0 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: 'red' },
  header: { position: 'relative', alignItems: 'center', marginBottom: 16, marginTop: 16 },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 12 },
  name: { fontSize: 24, fontWeight: '600' },
  bio: { fontSize: 16, color: '#444', marginTop: 8 },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  label: { fontWeight: '600', marginRight: 6, fontSize: 16, color: '#333' },
  value: { fontSize: 16, color: '#444', flexShrink: 1 },
  socialRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
  socialButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#312783', justifyContent: 'center', alignItems: 'center', marginHorizontal: 8 },
  // Certifications badges container and badge styles are now extracted into CertificationsList component
  chipContainer: { marginTop: 12, flexDirection: 'row', borderRadius: 20 },
  chip: { alignSelf: 'flex-start' },
  communityChip: { position: 'absolute', top: 0, right: 10, borderRadius: 20 },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16 },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '600', color: '#312783' },
  statLabel: { fontSize: 14, color: '#444' },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#312783', marginTop: 24, marginBottom: 8 },
  flexContainer: { flex: 1, backgroundColor: '#fff' },
  tabView: { flex: 1 },
});

export default PublicUserProfile;
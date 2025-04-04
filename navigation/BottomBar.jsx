import React, { useContext, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faUser, faCompass, faSquarePlus, faBahai, faAlignLeft, faBell } from '@fortawesome/free-solid-svg-icons';
import { useNavigation } from '@react-navigation/native';

import { UserContext } from '../contexts/UserContext';
import SocialMediaScreen from '../screens/SocialMedia';
import EventsScreen from '../screens/Events';
import NotificationScreen from '../screens/Notifications';
import ActivitiesScreen from '../screens/Activities';
import CreatePostScreen from '../screens/CreatePost';
import ProfileStackNavigator from '../navigation/ProfileStackNavigator';

// 1. Import the WelcomeModal
import WelcomeModal from '../modal/WelcomeModal';

const Tab = createBottomTabNavigator();

const tabIcons = {
  Profile: faUser,
  Feed: faCompass,
  Camera: faSquarePlus,
  Notifications: faBell,
  Events: faBahai,
  Activities: faAlignLeft,
};

const BottomBar = ({ initialPosts }) => {
  const { isLoggedIn } = useContext(UserContext);
  const navigation = useNavigation(); 
  const [modalVisible, setModalVisible] = useState(false);
  const [scrollToTop, setScrollToTop] = useState(false);
  const { unreadCount } = useContext(UserContext);

  return (
    <>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <FontAwesomeIcon icon={tabIcons[route.name]} size={size} color={color} />
          ),
          tabBarActiveTintColor: '#312783',
          tabBarInactiveTintColor: 'gray',
          tabBarStyle: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 60,
            backgroundColor: '#fff',
            borderTopWidth: 1,
            borderTopColor: '#ddd'
          },
        })}
        screenListeners={({ navigation, route }) => ({
          tabPress: (e) => {
            const currentRouteIndex = navigation.getState().index;
            const currentRouteName = navigation.getState().routes[currentRouteIndex]?.name;

            if (!isLoggedIn && currentRouteName !== 'Feed') {
              e.preventDefault();
              setModalVisible(true);
            }

            // 🔥 If already on the Feed tab, trigger scroll to top
            if (currentRouteName === 'Feed') {
              setScrollToTop(prev => !prev);
            }
          },
        })}
      >
        <Tab.Screen name="Feed">
          {() => <SocialMediaScreen initialPosts={initialPosts} scrollToTop={scrollToTop} />}
        </Tab.Screen>
        <Tab.Screen 
          name="Activities" 
          component={ActivitiesScreen} 
        />
        <Tab.Screen 
          name="Camera" 
          component={CreatePostScreen} 
        />
        <Tab.Screen 
          name="Events" 
          component={EventsScreen} 
        />
        <Tab.Screen
          name="Notifications"
          component={NotificationScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <FontAwesomeIcon icon={faBell} color={color} size={size} />
            ),
            tabBarBadge: unreadCount > 0 ? unreadCount : null,
          }}
        />

        <Tab.Screen 
          name="Profile" 
          component={ProfileStackNavigator} 
        />
      </Tab.Navigator>

      <WelcomeModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </>
  );
};

export default BottomBar;

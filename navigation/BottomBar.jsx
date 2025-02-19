import React, { useContext, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faUser, faCompass, faSquarePlus, faBahai, faAlignLeft } from '@fortawesome/free-solid-svg-icons';

import { UserContext } from '../contexts/UserContext';
import SocialMediaScreen from '../screens/SocialMedia';
import EventsScreen from '../screens/Events';
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
  Events: faBahai,
  Activities: faAlignLeft,
};

const BottomBar = ({ initialPosts }) => {
  const { isLoggedIn } = useContext(UserContext);
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <>
      {/* 2. Wrap the navigator in a fragment so we can place the modal afterwards */}
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
            borderTopColor: '#ddd',
          },
        })}
        screenListeners={({ route }) => ({
          tabPress: (e) => {
            if (!isLoggedIn() && route.name !== 'Feed') {
              e.preventDefault();
              setModalVisible(true);
            }
          },
        })}
      >
        <Tab.Screen name="Feed">
          {() => <SocialMediaScreen initialPosts={initialPosts} />}
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
          name="Profile" 
          component={ProfileStackNavigator} 
        />
      </Tab.Navigator>

      {/* 3. Render the WelcomeModal at the same level as the Tab.Navigator */}
      <WelcomeModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </>
  );
};

export default BottomBar;

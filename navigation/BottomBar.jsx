import React, { useContext, useState } from 'react';
import { View } from 'react-native';
// import { Modal } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faUser, faCompass, faPlusCircle, faBahai, faSearch } from '@fortawesome/free-solid-svg-icons';
import { useNavigation } from '@react-navigation/native';

import { UserContext } from '../contexts/UserContext';
import themeVariables from '../styles/theme';
import SocialMediaScreen from '../screens/SocialMedia';
import Home from '../screens/Home';
import EventsScreen from '../screens/Events';
// Removed NotificationScreen import; Notifications handled via Home screen banner
import SearchScreen from '../screens/Search';
import ActivitiesScreen from '../screens/Activities';
import CreatePostScreen from '../screens/CreatePost';
import ProfileStackNavigator from '../navigation/ProfileStackNavigator';

// 1. Import the WelcomeModal
import WelcomeModal from '../modal/WelcomeModal';

const Tab = createBottomTabNavigator();

const tabIcons = {
  Home: faBahai,
  Profile: faUser,
  Feed: faCompass,
  Camera: faPlusCircle,
  Search: faSearch,
};

const BottomBar = ({ initialPosts, homeOverview }) => {
  const { isLoggedIn } = useContext(UserContext);
  const navigation = useNavigation(); 
  const [modalVisible, setModalVisible] = useState(false);
  const [scrollToTop, setScrollToTop] = useState(false);
  // removed unreadCount; notifications accessed via Home banner button

  return (
    <>
      <Tab.Navigator
        // Default to Home tab
        initialRouteName="Home"
        screenOptions={({ route }) => ({
          headerShown: false,
          // Hide labels, show icons only
          tabBarShowLabel: false,
          // Render icon with active top border
          tabBarIcon: ({ focused, color, size }) => {
            // Determine icon color: camera retains tint, others always black
            const iconColor = route.name === 'Camera'
              ? color
              : themeVariables.blackColor;
            return (
              <View style={{ alignItems: 'center' }}>
                {/* Top border bar, above the icon */}
                {focused && (
                  <View style={{
                    height: 4,
                    width: size + 6, // match old marginHorizontal: 12
                    backgroundColor: themeVariables.primaryColor,
                    borderBottomLeftRadius: 5,
                    borderBottomRightRadius: 5,
                    marginBottom: 6,
                    transform: [{ translateY: -2 }],
                  }} />
                )}
                {/* Icon colored per route */}
                <FontAwesomeIcon
                  icon={tabIcons[route.name]}
                  size={size}
                  color={iconColor}
                />
              </View>
            );
          },
          tabBarActiveTintColor: themeVariables.primaryColor,
          tabBarInactiveTintColor: themeVariables.primaryColor,
          tabBarStyle: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 80,
            backgroundColor: themeVariables.greyColor,
            borderTopWidth: 1,
            borderTopColor: themeVariables.whiteColor,
          },
        })}
        screenListeners={({ navigation, route }) => ({
          tabPress: e => {
            const state = navigation.getState();
            const currentRoute = state.routes[state.index]?.name;
            // Intercept Camera tab to open as modal
            if (route.name === 'Camera') {
              e.preventDefault();
              if (!isLoggedIn) {
                setModalVisible(true);
              } else {
                // Navigate to the CreatePost modal in parent stack
                navigation.getParent()?.navigate('CreatePostModal');
              }
              return;
            }
            // Require login for other tabs (except Feed)
            if (!isLoggedIn && route.name !== 'Feed') {
              e.preventDefault();
              setModalVisible(true);
              return;
            }
            // Scroll to top on Feed if already active
            if (route.name === 'Feed' && currentRoute === 'Feed') {
              e.preventDefault();
              setScrollToTop(prev => !prev);
            }
          },
        })}
      >
        {/* Pass homeOverview as a prop via render callback */}
        <Tab.Screen name="Home">
          {props => <Home {...props} homeOverview={homeOverview} />}
        </Tab.Screen>
        <Tab.Screen name="Feed">
          {props => <SocialMediaScreen {...props} initialPosts={initialPosts} scrollToTop={scrollToTop} />}
        </Tab.Screen>
        <Tab.Screen
          name="Camera"
          component={CreatePostScreen}
        />
        <Tab.Screen
          name="Search"
          component={SearchScreen}
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

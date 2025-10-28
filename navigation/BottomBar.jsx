import React, { useContext, useState } from 'react';
import { View } from 'react-native';
// import { Modal } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { UserContext } from '../contexts/UserContext';
import themeVariables from '../styles/theme';
import SocialMediaScreen from '../screens/SocialMedia';
import Home from '../screens/Home';
// Removed NotificationScreen import; Notifications handled via Home screen banner
import SearchScreen from '../screens/Search';
import CreatePostScreen from '../screens/CreatePost';
import ProfileStackNavigator from '../navigation/ProfileStackNavigator';
import Gather from '../screens/Gather';

// 1. Import the WelcomeModal
import WelcomeModal from '../modal/WelcomeModal';

const Tab = createBottomTabNavigator();

const tabIcons = {
  Home: 'home-outline',
  Profile: 'person-outline',
  Feed: 'compass-outline',
  Camera: 'add-circle',
  Search: 'search-outline',
  Gather: 'map-outline',
};

const BottomBar = ({ initialPosts, homeOverview }) => {
  const { isLoggedIn } = useContext(UserContext);
  const [modalVisible, setModalVisible] = useState(false);
  const [scrollToTop, setScrollToTop] = useState(false);

  return (
    <>
      <Tab.Navigator
        initialRouteName="Home"
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarShowLabel: false,

          tabBarIcon: ({ focused, color, size }) => {
            // bump every icon +6px for bigger taps & visuals
            const iconSize = size + 4;
            // camera keeps tint, others always black
            const iconColor =
              route.name === 'Camera' ? color : themeVariables.blackColor;
            // choose filled when focused, outline otherwise
            const baseName = tabIcons[route.name] || '';
            const iconName = focused
              ? baseName.replace(/-outline$/, '')
              : baseName;

            // recalc wrapper to keep icon dead-center in 80px bar
            const barHeight = 80;
            const indicatorHeight = 4;
            const wrapperWidth = iconSize + 6;
            const baseMargin = (barHeight - iconSize) / 1.5;
            const iconMarginTop = focused
              ? baseMargin - indicatorHeight - 1
              : baseMargin;

            return (
              <View
                style={{
                  width: wrapperWidth,
                  height: barHeight,
                  alignItems: 'center',
                }}
              >
                {focused && (
                  <View
                    style={{
                      height: indicatorHeight,
                      width: wrapperWidth,
                      backgroundColor: themeVariables.primaryColor,
                      borderBottomLeftRadius: 5,
                      borderBottomRightRadius: 5,
                      top: 20,
                    }}
                  />
                )}
                <Ionicons
                  name={iconName}
                  size={iconSize}
                  color={iconColor}
                  style={{ marginTop: iconMarginTop }}
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
          tabPress: (e) => {
            const state = navigation.getState();
            const currentRoute = state.routes[state.index]?.name;

            // Intercept Camera tab to open as modal
            if (route.name === 'Camera') {
              e.preventDefault();
              if (!isLoggedIn) {
                setModalVisible(true);
              } else {
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
              setScrollToTop((prev) => !prev);
            }
          },
        })}
      >
        <Tab.Screen name="Home">
          {(props) => <Home {...props} homeOverview={homeOverview} />}
        </Tab.Screen>
        <Tab.Screen name="Feed">
          {(props) => (
            <SocialMediaScreen
              {...props}
              initialPosts={initialPosts}
              scrollToTop={scrollToTop}
            />
          )}
        </Tab.Screen>
        <Tab.Screen name="Camera" component={CreatePostScreen} />
        <Tab.Screen name="Gather" component={Gather} />
        <Tab.Screen name="Search" component={SearchScreen} />
        <Tab.Screen name="Profile" component={ProfileStackNavigator} />
      </Tab.Navigator>

      <WelcomeModal visible={modalVisible} onClose={() => setModalVisible(false)} />
    </>
  );
};

export default BottomBar;

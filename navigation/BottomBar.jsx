import React, { useContext, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faUser, faCompass, faSquarePlus, faBahai, faAlignLeft } from '@fortawesome/free-solid-svg-icons';
import { Modal, View, StyleSheet, TouchableOpacity } from 'react-native';

import { UserContext } from '../contexts/UserContext';
import SocialMediaScreen from '../screens/SocialMedia';
import EventsScreen from '../screens/Events';
import ActivitiesScreen from '../screens/Activities';
import PostScreen from '../screens/Post';
import WelcomeScreen from '../screens/Welcome';
import ProfileStackNavigator from '../navigation/ProfileStackNavigator';

const Tab = createBottomTabNavigator();

const tabIcons = {
  Profile: faUser,
  SocialMedia: faCompass,
  Camera: faSquarePlus,
  Events: faBahai,
  Activities: faAlignLeft,
};

const BottomBar = () => {
  const { isLoggedIn } = useContext(UserContext);
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => (
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
        screenListeners={({ navigation, route }) => ({
          tabPress: (e) => {
            if (!isLoggedIn() && route.name !== 'SocialMedia') {
              e.preventDefault();
              setModalVisible(true);
            }
          },
        })}
      >
        <Tab.Screen name="SocialMedia" component={SocialMediaScreen} options={{ title: 'Feed' }} />
        <Tab.Screen name="Activities" component={ActivitiesScreen} />
        <Tab.Screen name="Camera" component={PostScreen} />
        <Tab.Screen name="Events" component={EventsScreen} />
        <Tab.Screen name="Profile" component={ProfileStackNavigator} />
      </Tab.Navigator>

      {/* Welcome Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <TouchableOpacity 
          style={styles.modalBackground} 
          activeOpacity={1} 
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <WelcomeScreen closeModal={() => setModalVisible(false)} />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

export default BottomBar;

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)', // Slight background dimming
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    height: '90%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
  },
});

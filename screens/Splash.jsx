import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import splashLogo from '../assets/img/LS_Splash.png';

const Splash = () => {
  return (
    <View style={styles.container}>
      <Image 
        source={splashLogo} 
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
};

export default Splash;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#312783',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    resizeMode: 'cover',
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    zIndex: 1,
  },
});


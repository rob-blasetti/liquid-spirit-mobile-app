// Splash.jsx
import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

// If you have a local logo/image, import it like this:
// import splashLogo from '../assets/logo.png';

const Splash = () => {
  return (
    <View style={styles.container}>
      {/* Uncomment the Image component below and use your own logo */}
      {/* <Image source={splashLogo} style={styles.logo} /> */}

      <Text style={styles.title}>My App Splash</Text>
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
    width: 120,
    height: 120,
    marginBottom: 20,
    resizeMode: 'contain',
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
});

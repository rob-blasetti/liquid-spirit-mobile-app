import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import themeVariables from '../styles/theme';

const Welcome = ({ closeModal }) => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Liquid Spirit</Text>
      <Text style={styles.subtitle}>Join the Baha'i vibe.</Text>

      <TouchableOpacity
        testID="welcome-login"
        accessibilityRole="button"
        accessibilityLabel="welcome-login"
        style={styles.button}
        onPress={() => {
          navigation.navigate('Login');
          if (closeModal) closeModal(); // ✅ Close modal on navigation
        }}
      >
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      <TouchableOpacity
        testID="welcome-register"
        accessibilityRole="button"
        accessibilityLabel="welcome-register"
        style={[styles.button, styles.registerButton]}
        onPress={() => {
          navigation.navigate('Register');
          if (closeModal) closeModal(); // ✅ Close modal on navigation
        }}
      >
        <Text style={styles.registerButtonText}>Register</Text>
      </TouchableOpacity>

      {/* Forgot Password Button */}
      <TouchableOpacity
        testID="welcome-forgot-password"
        accessibilityRole="button"
        accessibilityLabel="welcome-forgot-password"
        style={styles.forgotPasswordButton}
        onPress={() => {
          navigation.navigate('ForgotPassword');
          if (closeModal) closeModal(); // ✅ Close modal on navigation
        }}
      >
        <Text style={styles.forgotPasswordText}>Forgot your password?</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: themeVariables.screenBackgroundColor,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#312783',
    marginBottom: 16,
    textAlign: 'center',
    width: Platform.select({ ios: 180, android: 200 }),
  },
  subtitle: {
    fontSize: 18,
    color: '#555',
    marginBottom: 32,
    textAlign: 'center',
    width: Platform.select({ ios: 180, android: 180 }),
  },
  button: {
    backgroundColor: '#312783',
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  registerButton: {
    backgroundColor: '#fff',
    borderColor: '#312783',
    borderWidth: 1,
  },
  registerButtonText: {
    color: '#312783',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    width: Platform.select({ ios: 180, android: 180 }),
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    width: Platform.select({ ios: 180, android: 180 }),
  },
  forgotPasswordButton: {
    marginBottom: 16,
    textAlign: 'center',
    width: Platform.select({ ios: 180, android: 180 }),
  },
  forgotPasswordText: {
    color: '#0485e2',
    fontSize: 14,
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
  closeButton: {
    marginTop: 20,
    padding: 10,
  },
  closeButtonText: {
    color: '#312783',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});

export default Welcome;

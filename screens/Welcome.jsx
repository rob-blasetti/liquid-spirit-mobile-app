import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

const Welcome = ({ closeModal }) => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Liquid Spirit</Text>
      <Text style={styles.subtitle}>Join the Baha'i vibe.</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          navigation.navigate('Login');
          if (closeModal) closeModal(); // ✅ Close modal on navigation
        }}
      >
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      <TouchableOpacity
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
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#312783',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    color: '#555',
    marginBottom: 32,
    textAlign: 'center',
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
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  forgotPasswordButton: {
    marginBottom: 16,
  },
  forgotPasswordText: {
    color: '#312783',
    fontSize: 14,
    textDecorationLine: 'underline',
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

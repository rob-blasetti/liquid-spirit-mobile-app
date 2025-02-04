import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useAuthService } from '../services/AuthService';

const ForgotPassword = ({ navigation }) => {
  const [email, setEmail] = useState('');

  // Get forgotPassword from your custom hook
  const { forgotPassword } = useAuthService();

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter an email address.');
      return;
    }

    try {
      // Call the forgotPassword method from the hook
      const { ok, data } = await forgotPassword(email);

      if (ok) {
        // If the server returned success
        Alert.alert(
          'Success',
          data?.message || 'Password reset link has been sent to your email.'
        );
        navigation.goBack();
      } else {
        // If the server responded but with an error status
        Alert.alert('Error', data?.message || 'Something went wrong.');
      }
    } catch (error) {
      // If there was a network or other error
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Forgot Password</Text>
      <Text style={styles.subtitle}>
        Please enter your email address to reset your password
      </Text>

      <TextInput
        style={styles.input}
        placeholder='Email Address'
        value={email}
        onChangeText={setEmail}
        keyboardType='email-address'
        autoCapitalize='none'
      />

      <TouchableOpacity style={styles.button} onPress={handleForgotPassword}>
        <Text style={styles.buttonText}>Send Password Reset</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ForgotPassword;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#312783',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#555',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  input: {
    height: 50,
    width: '100%',
    paddingHorizontal: 16,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 20,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#312783',
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
    width: '100%',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useAuthService } from '../services/AuthService';
import themeVariables from '../styles/theme';
import { isValidEmail } from '../utils/validation';
import FormTextInput from '../components/forms/inputs/FormTextInput';

const ForgotPassword = ({ navigation }) => {
  const [email, setEmail] = useState('');

  // Get forgotPassword from your custom hook
  const { forgotPassword } = useAuthService();

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter an email address.');
      return;
    }

    if (!isValidEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address.');
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

      {/* Email Label and Input */}
      <Text style={styles.label}>Email Address</Text>
      <View style={styles.inputWrapper}>
        <FormTextInput
          value={email}
          onChangeText={setEmail}
          inputProps={{
            placeholder: 'you@example.com',
            keyboardType: 'email-address',
            autoCapitalize: 'none',
            autoCorrect: false,
            textContentType: 'emailAddress',
            autoComplete: 'email',
            accessibilityLabel: 'Email Address',
          }}
        />
      </View>

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
    backgroundColor: themeVariables.screenBackgroundColor,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#312783',
    marginBottom: 10,
    textAlign: 'center',
    width: 260,

  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#555',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  // Label above inputs for clarity on all devices
  label: {
    width: '100%',
    fontSize: 16,
    color: themeVariables.blackColor,
    marginBottom: 6,
    alignSelf: 'flex-start',
    fontWeight: '600',
  },
  inputWrapper: {
    width: '100%',
    alignSelf: 'stretch',
    marginBottom: 20,
  },
  button: {
    backgroundColor: themeVariables.primaryColor,
    padding: 16,
    borderRadius: 999,
    alignItems: 'center',
    width: '100%',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    width: 180,
    textAlign: 'center',

  },
});

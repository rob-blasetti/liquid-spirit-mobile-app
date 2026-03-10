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
import FormTextInput from '../components/forms/inputs/FormTextInput';

const ForgotBahaiId = ({ navigation }) => {
  const [email, setEmail] = useState('');

  const { forgotBahaiId } = useAuthService();

  const handleForgotBahaiId = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter an email address.');
      return;
    }

    try {
      const { ok, data } = await forgotBahaiId(email);

      if (ok) {
        Alert.alert(
          'Success',
          data?.message || 'Your Bahá\'í ID has been sent to your email.'
        );
        navigation.goBack();
      } else {
        Alert.alert('Error', data?.message || 'Something went wrong.');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Forgot Bahá'í ID</Text>
      <Text style={styles.subtitle}>
        Please enter your email address to retrieve your Bahá'í ID.
      </Text>

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

      <TouchableOpacity
        style={styles.button}
        onPress={handleForgotBahaiId}
        accessibilityRole="button"
        accessibilityLabel="Send Bahá'í ID"
        accessibilityHint="Sends your Bahá'í ID to the email address you entered"
      >
        <Text style={styles.buttonText}>Send Bahá'í ID</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ForgotBahaiId;

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

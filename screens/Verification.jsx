import React, { useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import themeVariables from '../styles/theme';

// Import the custom hook
import { useAuthService } from '../services/AuthService';
import FormTextInput from '../components/forms/inputs/FormTextInput';

const Verification = ({ route }) => {
  const navigation = useNavigation();
  const { bahaiId, email, password } = route.params;

  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Destructure `verify` from `useAuthService`
  const { verify } = useAuthService();

  const handleVerification = async () => {
    if (!verificationCode) {
      Alert.alert('Error', 'Please enter your verification code.');
      return;
    }

    Keyboard.dismiss();
    setLoading(true);

    try {
      // Call `verify` from the hook instead of using fetch
      const { ok, data } = await verify(bahaiId, verificationCode, password, email);

      if (!ok) {
        // If the server responded with an error
        throw new Error(data?.message || 'Invalid verification code.');
      }

      // If everything is OK:
      Alert.alert('Success', 'Your email has been verified!');
      navigation.navigate('Main', { screen: 'Home' });
    } catch (error) {
      // Catch network or error response
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.header}>Verify Your Email</Text>
          <Text style={styles.description}>
            Enter the 6-digit code sent to your email: {email}
          </Text>

          <Text style={styles.label}>Verification Code</Text>
          <View style={styles.inputWrapper}>
            <FormTextInput
              value={verificationCode}
              onChangeText={text => {
                setVerificationCode(text);
                if (message) {
                  setMessage('');
                }
              }}
              errorText={message}
              inputProps={{
                placeholder: 'Enter verification code',
                keyboardType: 'numeric',
                maxLength: 6,
                accessibilityLabel: 'Verification Code',
                returnKeyType: 'done',
                onSubmitEditing: handleVerification,
              }}
            />
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={handleVerification}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.buttonText}>Verify</Text>
            }
          </TouchableOpacity>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default Verification;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeVariables.screenBackgroundColor,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: themeVariables.primaryColor,
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    color: '#555',
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
    marginBottom: 15,
  },
  button: {
    backgroundColor: themeVariables.primaryColor,
    paddingVertical: 15,
    borderRadius: 999,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

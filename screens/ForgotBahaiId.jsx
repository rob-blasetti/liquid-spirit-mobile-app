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
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TouchableOpacity style={styles.button} onPress={handleForgotBahaiId}>
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
    backgroundColor: '#fff',
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
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
    alignSelf: 'flex-start',
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
    width: 180,
    textAlign: 'center',
  },
});
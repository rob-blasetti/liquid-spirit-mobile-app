import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuthService } from '../services/AuthService';
import { useNavigation } from '@react-navigation/native';
import themeVariables from '../styles/theme';
import {
  isValidEmail,
  isValidBahaiId,
  isValidPassword,
} from '../utils/validation';

const Register = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [bahaiId, setBahaiId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isEulaAccepted, setIsEulaAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  const { signUp } = useAuthService();

  const handleRegister = async () => {
    if (!email || !bahaiId || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill all fields.');
      return;
    }

    if (!isValidEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address.');
      return;
    }

    if (!isValidBahaiId(bahaiId)) {
      Alert.alert('Error', "Bahá'í ID must contain only numbers.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    if (!isValidPassword(password)) {
      Alert.alert(
        'Error',
        'Password must be at least 8 characters and include a number and a letter. Special characters are allowed.'
      );
      return;
    }

    if (!isEulaAccepted) {
      Alert.alert('Error', 'You must accept the EULA before registering.');
      return;
    }

    setLoading(true);

    try {
      const { ok, data } = await signUp(email, bahaiId, password);
      if (ok) {
        Alert.alert('Success', 'Verification code sent to your email.');
        navigation.navigate('Verification', { bahaiId, email, password });
      } else {
        Alert.alert('Error', data?.message || 'Registration failed.');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again later.');
      console.error('Register error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register</Text>

      {/* Email Label and Input */}
      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />
      {/* Bahá'í ID Label and Input */}
      <Text style={styles.label}>Bahá'í ID</Text>
      <TextInput
        style={styles.input}
        value={bahaiId}
        onChangeText={(text) => setBahaiId(text.replace(/[^0-9]/g, ''))}
        keyboardType="numeric"
      />
      {/* Password Label and Input */}
      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      {/* Confirm Password Label and Input */}
      <Text style={styles.label}>Confirm Password</Text>
      <TextInput
        style={styles.input}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />

      {/* ✅ Custom Checkbox Using FontAwesome */}
      <TouchableOpacity
        style={styles.checkboxContainer}
        onPress={() => setIsEulaAccepted(!isEulaAccepted)}
      >
        <Ionicons
          name={isEulaAccepted ? 'checkbox' : 'square-outline'}
          size={24}
          color={isEulaAccepted ? '#312783' : '#aaa'}
        />
        <TouchableOpacity onPress={() => navigation.navigate('EULA')}>
          <Text style={styles.eulaText}>I agree to the EULA</Text>
        </TouchableOpacity>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator size="large" color="#312783" />
      ) : (
        <TouchableOpacity
          style={[styles.button, !isEulaAccepted && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={!isEulaAccepted}
        >
          <Text style={styles.buttonText}>Register</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.link}>
        <Text style={styles.linkText}>Already have an account?</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('ForgotBahaiId')} style={styles.link}>
        <Text style={styles.linkText}>Forgot my Bahá'í ID?</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Register;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: themeVariables.darkGreyColor,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#312783',
    marginBottom: 32,
    width: Platform.select({ android: 140 }),
    textAlign: 'center',
  },
  // Label above inputs for clarity on all devices
  label: {
    width: '100%',
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
    alignSelf: 'flex-start',
  },
  input: {
    width: '100%',
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  eulaText: {
    color: '#0485e2',
    textDecorationLine: 'underline',
    marginLeft: 8,
    width: Platform.select({ android: 160 }),
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#312783',
    padding: 16,
    borderRadius: 40,
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: '#aaa',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    width: Platform.select({ android: 120 }),
    textAlign: 'center',
  },
  link: {
    marginTop: 16,
    width: Platform.select({ android: 180 }),
    textAlign: 'center',
  },
  linkText: {
    color: '#0485e2',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});

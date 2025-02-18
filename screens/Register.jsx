import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faCheckSquare, faSquare } from '@fortawesome/free-solid-svg-icons';
import { useAuthService } from '../services/AuthService';
import { useNavigation } from '@react-navigation/native';

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

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
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

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TextInput
        style={styles.input}
        placeholder="Bahá'í ID"
        value={bahaiId}
        onChangeText={setBahaiId}
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />

      {/* ✅ Custom Checkbox Using FontAwesome */}
      <TouchableOpacity
        style={styles.checkboxContainer}
        onPress={() => setIsEulaAccepted(!isEulaAccepted)}
      >
        <FontAwesomeIcon
          icon={isEulaAccepted ? faCheckSquare : faSquare}
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
        <Text style={styles.linkText}>Already have an account? Login</Text>
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
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#312783',
    marginBottom: 32,
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
  },
  button: {
    backgroundColor: '#312783',
    padding: 16,
    borderRadius: 8,
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
  },
  link: {
    marginTop: 16,
  },
  linkText: {
    color: '#0485e2',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});

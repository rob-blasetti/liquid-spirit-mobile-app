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

// Import your custom hook
import { useAuthService } from '../services/AuthService';
import { useNavigation } from '@react-navigation/native';

const Register = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [bahaiId, setBahaiId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Destructure 'signUp' from your custom hook
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

    setLoading(true);

    try {
      // Use the signUp method from the hook
      const { ok, data } = await signUp(email, bahaiId, password);

      if (ok) {
        Alert.alert('Success', 'Verification code sent to your email.');
        // Navigate to Verification screen
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
        placeholder='Email'
        value={email}
        onChangeText={setEmail}
        keyboardType='email-address'
        autoCapitalize='none'
        autoCorrect={false}
      />
      <TextInput
        style={styles.input}
        placeholder="Bahá'í ID"
        value={bahaiId}
        onChangeText={setBahaiId}
        keyboardType='numeric'
      />
      <TextInput
        style={styles.input}
        placeholder='Password'
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TextInput
        style={styles.input}
        placeholder='Confirm Password'
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />
      {loading ? (
        <ActivityIndicator size='large' color='#312783' />
      ) : (
        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>Register</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        onPress={() => navigation.navigate('Login')}
        style={styles.link}
      >
        <Text style={styles.linkText}>Already have an account? Login</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Register;

const styles = StyleSheet.create({
  // same styles as in your code
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
  button: {
    backgroundColor: '#312783',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
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

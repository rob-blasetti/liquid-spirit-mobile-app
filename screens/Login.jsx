import React, { useState, useContext, useEffect } from 'react';
import { Platform, View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, TextInput } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import themeVariables from '../styles/theme';
import { UserContext } from '../contexts/UserContext';
import * as Keychain from 'react-native-keychain';
import { AUTH_API_URL, API_URL } from '../config';
import { isValidEmail, isValidPassword } from '../utils/validation';
import SlideBanner from '../components/SlideBanner';
import PasswordField from '../components/forms/inputs/PasswordField';

const Login = ({ navigation, route }) => {
  const AUTH_BASE = String(AUTH_API_URL || API_URL || '').replace(/\/$/, '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [bannerMessage, setBannerMessage] = useState('');

  const { login } = useContext(UserContext);

  useEffect(() => {
    const loadCredentials = async () => {
      try {
        let creds;
        try {
          // Attempt Face ID authentication first
          creds = await Keychain.getGenericPassword({
            authenticationPrompt: { title: 'Authenticate with Face ID' },
            authenticationType: Keychain.AUTHENTICATION_TYPE.BIOMETRICS,
          });
        } catch (authError) {
          // If Face ID fails or is unavailable, fall back to plain retrieval
          creds = await Keychain.getGenericPassword();
        }
        if (creds) {
          setEmail(creds.username);
          setPassword(creds.password);
        }
      } catch (err) {
        console.log('Failed to load stored credentials', err);
      }
    };

    loadCredentials();
  }, []);

  useEffect(() => {
    const msg = route?.params?.bannerMessage;
    if (msg) {
      setBannerMessage(msg);
      navigation.setParams({ bannerMessage: undefined });
    }
  }, [route?.params?.bannerMessage, navigation]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }

    if (!isValidEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address.');
      return;
    }

    if (!isValidPassword(password)) {
      Alert.alert(
        'Error',
        'Password must be at least 8 characters and include a number and a letter. Special characters are allowed.'
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${AUTH_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (response.ok) {
        const authToken = result.accessToken || result.token || result.newAccessToken;
        const refreshToken = result.newRefreshToken || result.refreshToken;
        await login(result.user, authToken, refreshToken, email, password);
        await Keychain.setGenericPassword(email, password, {
          accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        });
        navigation.navigate('Main', { screen: 'Home' });
      } else {
        Alert.alert('Error', result.message || 'Login failed.');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again later.');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      {bannerMessage ? <SlideBanner message={bannerMessage} onClose={() => setBannerMessage('')} /> : null}
      <View style={[styles.container, bannerMessage ? styles.containerWithBanner : null]}>
        <Text style={styles.label}>Email</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            placeholderTextColor={themeVariables.darkGreyColor || '#777'}
          />
        </View>
        <Text style={styles.label}>Password</Text>
        <PasswordField
          value={password}
          onChangeText={setPassword}
          placeholder="Enter your password"
          inputStyle={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {loading ? (
          <ActivityIndicator size="large" color={themeVariables.primaryColor} />
        ) : (
          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={() => navigation.navigate('Register')}
          style={styles.link}
        >
          <Text style={styles.linkText}>Don't have an account?</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: themeVariables.screenBackgroundColor,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
    width: '100%',
    padding: 16,
    backgroundColor: themeVariables.screenBackgroundColor,
  },
  containerWithBanner: {
    paddingTop: 70,
  },
  label: {
    width: '100%',
    fontSize: 16,
    color: themeVariables.blackColor,
    marginBottom: 6,
    fontWeight: '600',
  },
  input: {
    width: '100%',
    alignSelf: 'stretch',
    backgroundColor: themeVariables.lightGreyColor || '#f3f3f3',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 16,
  },
  inputWrapper: {
    width: '100%',
    alignSelf: 'stretch',
  },
  button: {
    backgroundColor: '#312783',
    padding: 16,
    borderRadius: 30,
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
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
    backgroundColor: themeVariables.screenBackgroundColor,
    alignSelf: 'center',
  },
  linkText: {
    color: '#0485e2',
    fontSize: 14,
    textDecorationLine: 'underline',
    width: Platform.select({ android: 280 }),
    textAlign: 'center',
  },
});

export default Login;

import React, { useState, useContext, useEffect } from 'react';
import {
  Platform,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import themeVariables from '../styles/theme';
import { UserContext } from '../contexts/UserContext';
import * as Keychain from 'react-native-keychain';
import { Linking } from 'react-native';
import { AUTH_API_URL, API_URL, PASSKEY_WEBSITE_PATH, WEB_APP_URL } from '../config';
import { isValidEmail, isValidPassword } from '../utils/validation';
import { useAuthService, getCurrentUserId } from '../services/AuthService';
import SlideBanner from '../components/SlideBanner';
import PasswordField from '../components/forms/inputs/PasswordField';

const Login = ({ navigation, route }) => {
  const AUTH_BASE = String(AUTH_API_URL || API_URL || '').replace(/\/$/, '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [bannerMessage, setBannerMessage] = useState('');

  const { login } = useContext(UserContext);
  const { signIn, authenticateWithPasskey, isPasskeySupported, fetchMe } = useAuthService();

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
      const response = await signIn(email, password);

      if (response.ok) {
        const authToken = response.data.accessToken || response.data.token || response.data.newAccessToken;
        const refreshToken = response.data.newRefreshToken || response.data.refreshToken;
        await login(response.data.user, authToken, refreshToken, email, password);
        await Keychain.setGenericPassword(email, password, {
          accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        });
        navigation.navigate('Main', { screen: 'Home' });
      } else {
        Alert.alert('Error', response.data.message || 'Login failed.');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again later.');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const openPasskeyFallback = async () => {
    try {
      const url = `${String(WEB_APP_URL).replace(/\/$/, '')}${PASSKEY_WEBSITE_PATH || '/settings/security'}?from=mobile`;
      await Linking.openURL(url);
    } catch (error) {
      console.error('Error opening passkey web fallback:', error);
      Alert.alert('Passkey login unavailable', 'Unable to open passkey setup/login in web.');
    }
  };

  const parseTokenFromPayload = (payload = {}) =>
    payload.accessToken || payload.token || payload.newAccessToken || null;

  const parseUserFromPayload = (payload = {}) =>
    payload.user || payload.me || null;

  const normalizeUserFromToken = (tokenValue) => {
    const userId = getCurrentUserId(tokenValue);
    if (!userId) return { id: '', _id: '', email };
    return { id: userId, _id: userId, email };
  };

  const handlePasskeyLogin = async () => {
    setPasskeyLoading(true);

    try {
      const supported = await isPasskeySupported();
      if (!supported) {
        await openPasskeyFallback();
        return;
      }

      const { ok, data } = await authenticateWithPasskey();
      if (!ok) {
        const reason = data?.message || 'Passkey authentication failed. Please try again.';
        Alert.alert('Passkey Sign In Failed', reason);
        return;
      }

      const authToken = parseTokenFromPayload(data);
      if (!authToken) {
        Alert.alert('Passkey Sign In Failed', 'No auth token was returned from the server.');
        return;
      }

      let user = parseUserFromPayload(data);
      if (!user && data?.data) {
        user = parseUserFromPayload(data.data);
      }

      if (!user) {
        try {
          const meResult = await fetchMe();
          if (meResult.ok) {
            user = parseUserFromPayload(meResult.data) || meResult.data;
          }
        } catch (error) {
          console.log('Failed to hydrate passkey user profile:', error?.message || error);
        }
      }

      if (!user) {
        user = normalizeUserFromToken(authToken);
      }

      await login(user, authToken, null, null, null);
      navigation.navigate('Main', { screen: 'Home' });
    } catch (error) {
      console.error('Passkey login error:', error);
      Alert.alert('Passkey Sign In Error', error?.message || 'Unable to sign in with passkey.');
      await openPasskeyFallback();
    } finally {
      setPasskeyLoading(false);
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

        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {passkeyLoading ? (
          <View style={styles.passkeyButtonContainer}>
            <ActivityIndicator size="small" color={themeVariables.primaryColor} />
          </View>
        ) : (
          <TouchableOpacity
            style={styles.passkeyButton}
            onPress={handlePasskeyLogin}
            disabled={passkeyLoading}
          >
            <Ionicons name="key" size={18} color={themeVariables.whiteColor} />
            <Text style={styles.passkeyButtonText}>Sign in with passkey</Text>
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
  passkeyButtonContainer: {
    marginBottom: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  passkeyButton: {
    backgroundColor: '#0485e2',
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  passkeyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#d9d9d9',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#666',
    fontSize: 12,
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

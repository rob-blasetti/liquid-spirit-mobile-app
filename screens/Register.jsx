import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Platform } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuthService } from '../services/AuthService';
import { useNavigation } from '@react-navigation/native';
import themeVariables from '../styles/theme';
import {
  isValidEmail,
  isValidBahaiId,
  isValidPassword,
} from '../utils/validation';
import PasswordField from '../components/forms/inputs/PasswordField';
import FormTextInput from '../components/forms/inputs/FormTextInput';

const Register = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [bahaiId, setBahaiId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isEulaAccepted, setIsEulaAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { signUp } = useAuthService();

  const clearFieldError = (field) =>
    setErrors((prev) => (prev[field] ? { ...prev, [field]: '' } : prev));

  const handleRegister = async () => {
    const nextErrors = {};

    if (!email) {
      nextErrors.email = 'Email is required.';
    } else if (!isValidEmail(email)) {
      nextErrors.email = 'Please enter a valid email address.';
    }

    if (!bahaiId) {
      nextErrors.bahaiId = "Bahá'í ID is required.";
    } else if (!isValidBahaiId(bahaiId)) {
      nextErrors.bahaiId = "Bahá'í ID must contain only numbers.";
    }

    if (!password) {
      nextErrors.password = 'Password is required.';
    } else if (!isValidPassword(password)) {
      nextErrors.password =
        'Password must be at least 8 characters and include a number and a letter. Special characters are allowed.';
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = 'Confirm your password.';
    } else if (password !== confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }

    if (!isEulaAccepted) {
      nextErrors.eula = 'You must accept the EULA before registering.';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setLoading(true);

    try {
      const { ok, data } = await signUp(email, bahaiId, password);
      if (ok) {
        Alert.alert('Success', 'Verification code sent to your email.');
        navigation.navigate('Verification', { bahaiId, email, password });
      } else {
        setErrors({ general: data?.message || 'Registration failed.' });
      }
    } catch (error) {
      setErrors({ general: 'Something went wrong. Please try again later.' });
      console.error('Register error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Email</Text>
      <View style={styles.inputWrapper}>
        <FormTextInput
          value={email}
          onChangeText={(text) => {
            clearFieldError('email');
            setEmail(text);
          }}
          errorText={errors.email}
          inputProps={{
            placeholder: 'you@example.com',
            keyboardType: 'email-address',
            autoCapitalize: 'none',
            autoCorrect: false,
            textContentType: 'emailAddress',
            autoComplete: 'email',
            accessibilityLabel: 'Email',
          }}
        />
      </View>
      <Text style={styles.label}>Bahá'í ID</Text>
      <View style={styles.inputWrapper}>
        <FormTextInput
          value={bahaiId}
          onChangeText={(text) => {
            clearFieldError('bahaiId');
            setBahaiId(text.replace(/[^0-9]/g, ''));
          }}
          errorText={errors.bahaiId}
          inputProps={{
            placeholder: 'Numbers only',
            keyboardType: 'numeric',
            accessibilityLabel: "Bahá'í ID",
          }}
        />
      </View>
      <Text style={styles.label}>Password</Text>
      <View style={[styles.inputWrapper, styles.passwordWrapper]}>
        <PasswordField
          value={password}
          onChangeText={(text) => {
            clearFieldError('password');
            setPassword(text);
          }}
          placeholder="Create a password"
          inputStyle={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="newPassword"
          autoComplete="password-new"
        />
        {!!errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
      </View>
      <Text style={styles.label}>Confirm Password</Text>
      <View style={[styles.inputWrapper, styles.passwordWrapper]}>
        <PasswordField
          value={confirmPassword}
          onChangeText={(text) => {
            clearFieldError('confirmPassword');
            setConfirmPassword(text);
          }}
          placeholder="Re-enter your password"
          inputStyle={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="password"
          autoComplete="password"
        />
        {!!errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
      </View>

      {/* Custom checkbox using Ionicons */}
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
      {!!errors.eula && <Text style={styles.errorText}>{errors.eula}</Text>}
      {!!errors.general && <Text style={styles.errorText}>{errors.general}</Text>}

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
    alignItems: 'stretch',
    width: '100%',
    padding: 16,
    backgroundColor: themeVariables.screenBackgroundColor,
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
  input: {
    marginBottom: 16,
  },
  inputWrapper: {
    width: '100%',
    alignSelf: 'stretch',
  },
  passwordWrapper: {
    position: 'relative',
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
  errorText: {
    color: '#d32f2f',
    marginTop: -8,
    marginBottom: 8,
    fontSize: 13,
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
    alignSelf: 'center',
  },
  linkText: {
    color: '#0485e2',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});

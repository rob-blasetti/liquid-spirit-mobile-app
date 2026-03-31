import React, { useContext, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as Keychain from 'react-native-keychain';

import PasswordField from '../components/forms/inputs/PasswordField';
import { UserContext } from '../contexts/UserContext';
import { useAuthService } from '../services/AuthService';
import themeVariables from '../styles/theme';
import { isValidPassword } from '../utils/validation';

const PASSWORD_REQUIREMENTS =
  'Password must be at least 8 characters and include a number and a letter. Special characters are allowed.';

const getChangePasswordErrors = ({
  currentPassword,
  newPassword,
  confirmPassword,
}) => {
  const nextErrors = {};

  if (!currentPassword) {
    nextErrors.currentPassword = 'Current password is required.';
  }

  if (!newPassword) {
    nextErrors.newPassword = 'New password is required.';
  } else if (!isValidPassword(newPassword)) {
    nextErrors.newPassword = PASSWORD_REQUIREMENTS;
  } else if (currentPassword && currentPassword === newPassword) {
    nextErrors.newPassword = 'Your new password must be different from your current password.';
  }

  if (!confirmPassword) {
    nextErrors.confirmPassword = 'Please confirm your new password.';
  } else if (newPassword !== confirmPassword) {
    nextErrors.confirmPassword = 'New passwords do not match.';
  }

  return nextErrors;
};

const ChangePassword = ({ navigation }) => {
  const { user } = useContext(UserContext);
  const { changePassword } = useAuthService();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const clearFieldError = (field) =>
    setErrors(prev => {
      if (!prev[field] && !prev.general) {
        return prev;
      }

      const nextErrors = { ...prev };
      delete nextErrors[field];
      delete nextErrors.general;
      return nextErrors;
    });

  const validateField = (field, nextValue) => {
    const values = {
      currentPassword,
      newPassword,
      confirmPassword,
      [field]: nextValue,
    };
    const nextErrors = getChangePasswordErrors(values);

    setErrors(prev => {
      const mergedErrors = { ...prev };
      delete mergedErrors.general;

      if (nextErrors.currentPassword) {
        mergedErrors.currentPassword = nextErrors.currentPassword;
      } else {
        delete mergedErrors.currentPassword;
      }

      if (nextErrors.newPassword) {
        mergedErrors.newPassword = nextErrors.newPassword;
      } else {
        delete mergedErrors.newPassword;
      }

      if (nextErrors.confirmPassword) {
        mergedErrors.confirmPassword = nextErrors.confirmPassword;
      } else {
        delete mergedErrors.confirmPassword;
      }

      return mergedErrors;
    });
  };

  const persistUpdatedPassword = async () => {
    let username = typeof user?.email === 'string' ? user.email.trim() : '';

    if (!username) {
      try {
        const storedCredentials = await Keychain.getGenericPassword();
        if (storedCredentials?.username) {
          username = storedCredentials.username;
        }
      } catch (error) {
        console.warn('Failed to read stored credentials after password update:', error);
      }
    }

    if (!username) {
      return;
    }

    await Keychain.setGenericPassword(username, newPassword, {
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  };

  const handleSubmit = async () => {
    const nextErrors = getChangePasswordErrors({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      return;
    }

    setLoading(true);

    try {
      const { ok, data } = await changePassword(currentPassword, newPassword);

      if (!ok) {
        setErrors({ general: data?.message || 'Failed to update password.' });
        return;
      }

      await persistUpdatedPassword();
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setErrors({});

      Alert.alert('Success', data?.message || 'Password updated successfully.', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Error changing password:', error);
      setErrors({ general: error?.message || 'Failed to update password.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons name="lock-closed-outline" size={22} color={themeVariables.primaryColor} />
          </View>
          <Text style={styles.title}>Update Password</Text>
          <Text style={styles.subtitle}>
            Choose a new password for your account. If you use Face ID or saved sign-in details on this device,
            they'll be updated too.
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Current Password</Text>
          <PasswordField
            value={currentPassword}
            onChangeText={(text) => {
              clearFieldError('currentPassword');
              setCurrentPassword(text);
            }}
            placeholder="Enter your current password"
            textContentType="password"
            autoComplete="password"
            inputStyle={errors.currentPassword ? styles.inputError : null}
            onBlur={() => validateField('currentPassword', currentPassword)}
          />
          {!!errors.currentPassword && <Text style={styles.errorText}>{errors.currentPassword}</Text>}

          <Text style={styles.label}>New Password</Text>
          <PasswordField
            value={newPassword}
            onChangeText={(text) => {
              clearFieldError('newPassword');
              clearFieldError('confirmPassword');
              setNewPassword(text);
            }}
            placeholder="Enter a new password"
            textContentType="newPassword"
            autoComplete="password-new"
            inputStyle={errors.newPassword ? styles.inputError : null}
            onBlur={() => validateField('newPassword', newPassword)}
          />
          {!!errors.newPassword && <Text style={styles.errorText}>{errors.newPassword}</Text>}

          <Text style={styles.requirements}>{PASSWORD_REQUIREMENTS}</Text>

          <Text style={styles.label}>Confirm New Password</Text>
          <PasswordField
            value={confirmPassword}
            onChangeText={(text) => {
              clearFieldError('confirmPassword');
              setConfirmPassword(text);
            }}
            placeholder="Re-enter your new password"
            textContentType="newPassword"
            autoComplete="password-new"
            inputStyle={errors.confirmPassword ? styles.inputError : null}
            onBlur={() => validateField('confirmPassword', confirmPassword)}
          />
          {!!errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}

          {!!errors.general && <Text style={styles.errorText}>{errors.general}</Text>}

          <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
            {loading ? (
              <ActivityIndicator color={themeVariables.whiteColor} size="small" />
            ) : (
              <>
                <Ionicons name="save-outline" size={18} color={themeVariables.whiteColor} />
                <Text style={styles.buttonText}>Update Password</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: themeVariables.screenBackgroundColor,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
  },
  hero: {
    paddingVertical: 16,
  },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(49, 39, 131, 0.08)',
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: themeVariables.blackColor,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(0, 0, 0, 0.65)',
  },
  form: {
    paddingTop: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: themeVariables.blackColor,
    marginBottom: 8,
  },
  requirements: {
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(0, 0, 0, 0.6)',
    marginTop: -4,
    marginBottom: 16,
  },
  inputError: {
    borderColor: '#d32f2f',
  },
  errorText: {
    color: '#d32f2f',
    marginTop: -8,
    marginBottom: 12,
    fontSize: 13,
  },
  button: {
    minHeight: 52,
    marginTop: 8,
    borderRadius: 999,
    backgroundColor: themeVariables.primaryColor,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: 18,
  },
  buttonText: {
    color: themeVariables.whiteColor,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
});

export default ChangePassword;

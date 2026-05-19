import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import { CommonActions, useFocusEffect } from '@react-navigation/native';

import { UserContext } from '../contexts/UserContext';
import { useAuthService } from '../services/AuthService';
import { PASSKEY_WEBSITE_PATH, WEB_APP_URL } from '../config';
import themeVariables from '../styles/theme';

const SOCIAL_ACCOUNT_CONFIG = [
  { key: 'facebook', label: 'Facebook', icon: 'logo-facebook' },
  { key: 'instagram', label: 'Instagram', icon: 'logo-instagram' },
  { key: 'x', label: 'X', icon: 'x-twitter', iconSet: 'fontawesome6' },
  { key: 'linkedin', label: 'LinkedIn', icon: 'logo-linkedin' },
  { key: 'tiktok', label: 'TikTok', icon: 'musical-notes-outline' },
];

const Security = ({ navigation }) => {
  const { user, userDetails, token, logout } = useContext(UserContext);
  const { deleteAccount, createPasskey, isPasskeySupported, fetchPasskeyCredentials } =
    useAuthService();
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteText, setDeleteText] = useState('');
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [passkeys, setPasskeys] = useState([]);
  const [passkeysLoading, setPasskeysLoading] = useState(false);
  const fetchPasskeyCredentialsRef = useRef(fetchPasskeyCredentials);

  const baseWebSettingsUrl = `${WEB_APP_URL}${PASSKEY_WEBSITE_PATH}`;
  const userFirstName = typeof user?.firstName === 'string' && user.firstName.trim().length > 0
    ? user.firstName.trim()
    : 'My';

  useEffect(() => {
    fetchPasskeyCredentialsRef.current = fetchPasskeyCredentials;
  }, [fetchPasskeyCredentials]);

  const extractPasskeyCredentials = useCallback((payload) => {
    const candidates = [
      payload,
      payload?.data,
      payload?.result,
      payload?.credentials,
      payload?.passkeys,
      payload?.data?.credentials,
      payload?.data?.passkeys,
      payload?.result?.credentials,
      payload?.result?.passkeys,
      payload?.user?.credentials,
      payload?.user?.passkeys,
    ];

    for (const candidate of candidates) {
      if (Array.isArray(candidate)) {
        return candidate;
      }
    }

    return [];
  }, []);

  const normalizePasskey = useCallback((passkey, index) => {
    const id =
      passkey?._id ||
      passkey?.id ||
      passkey?.credentialId ||
      passkey?.credentialID ||
      passkey?.credential?.id;

    const createdAt = passkey?.createdAt || passkey?.created_at;

    return {
      id: id || `passkey-${index}`,
      label: `${userFirstName} Passkey`,
      createdAt,
      raw: passkey,
    };
  }, [userFirstName]);

  const loadPasskeys = useCallback(async () => {
    if (!token) {
      setPasskeys([]);
      return;
    }

    setPasskeysLoading(true);
    try {
      const result = await fetchPasskeyCredentialsRef.current();
      if (!result?.ok) {
        const errorMessage =
          result?.data?.error?.message || result?.data?.message || 'Failed to fetch passkeys.';
        const isRateLimited = result?.status === 429 || /too many requests/i.test(errorMessage);

        if (isRateLimited) {
          console.warn('Passkey fetch rate limited. Keeping current list.');
          return;
        }

        console.warn('Failed to fetch passkeys:', result?.data);
        setPasskeys([]);
        return;
      }

      const credentials = extractPasskeyCredentials(result.data);
      setPasskeys(credentials.map(normalizePasskey).filter(passkey => Boolean(passkey.id)));
    } catch (error) {
      console.error('Error fetching passkeys:', error);
      setPasskeys([]);
    } finally {
      setPasskeysLoading(false);
    }
  }, [extractPasskeyCredentials, normalizePasskey, token]);

  const hasPasskeys = passkeys.length > 0;
  const primaryPasskey = hasPasskeys ? passkeys[0] : null;
  const connectedSocialAccounts = useMemo(() => {
    const social = userDetails?.socialMedia || user?.socialMedia || userDetails?.social || user?.social || {};

    return SOCIAL_ACCOUNT_CONFIG.map(account => {
      const rawValue = typeof social?.[account.key] === 'string'
        ? social[account.key].trim()
        : '';

      return rawValue
        ? {
          ...account,
          value: rawValue,
        }
        : null;
    }).filter(Boolean);
  }, [user, userDetails]);

  useFocusEffect(useCallback(() => {
    loadPasskeys();
  }, [loadPasskeys]));

  const getRootNavigation = () => {
    let currentNav = navigation;
    while (currentNav?.getParent && currentNav.getParent()) {
      currentNav = currentNav.getParent();
    }
    return currentNav || navigation;
  };

  const openPasskeyFallback = async () => {
    try {
      const url = `${baseWebSettingsUrl}?from=mobile`;
      await Linking.openURL(url);
    } catch (error) {
      console.error('Error opening passkey setup:', error);
      Alert.alert('Passkey setup unavailable', 'Could not open web setup link from this device.');
    }
  };

  const handleCreatePasskey = async () => {
    if (!token) {
      Alert.alert('Not signed in', 'Please sign in before setting up a passkey.');
      return;
    }

    setPasskeyLoading(true);
    try {
      const supported = await isPasskeySupported();
      if (!supported) {
        Alert.alert(
          'Continue in browser',
          'This device does not support native passkey setup. You can continue in the browser and sign in there normally.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Browser',
              onPress: () => {
                openPasskeyFallback().catch((fallbackError) => {
                  console.error('Failed to open passkey fallback:', fallbackError);
                });
              },
            },
          ],
        );
        return;
      }

      const result = await createPasskey();
      if (result?.ok) {
        await loadPasskeys();
        Alert.alert('Passkey Created', 'Your passkey was set up successfully.');
      } else {
        const stage = result?.data?.stage ? ` (${result.data.stage})` : '';
        const nested = result?.data?.error || null;
        const detail =
          nested?.message ||
          result?.data?.message ||
          (Array.isArray(nested?.details) && nested.details[0]?.message) ||
          'Could not complete passkey setup.';
        const requestId = nested?.requestId || result?.data?.requestId;
        const status = result?.status ? ` [HTTP ${result.status}]` : '';
        const requestHint = requestId ? ` [req ${requestId}]` : '';
        Alert.alert('Passkey setup failed', `${detail}${status}${requestHint}${stage}`);
      }
    } catch (error) {
      console.error('Error during passkey setup:', error);
      Alert.alert(
        'Continue in browser',
        'Native passkey setup failed on this device. You can continue in the browser and sign in there normally.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open Browser',
            onPress: () => {
              openPasskeyFallback().catch((fallbackError) => {
                console.error('Failed to open passkey fallback:', fallbackError);
              });
            },
          },
        ],
      );
    } finally {
      setPasskeyLoading(false);
    }
  };

  const handleViewPasskey = useCallback(() => {
    if (!primaryPasskey) {
      return;
    }

    navigation.navigate('PasskeyDetails', { passkey: primaryPasskey });
  }, [navigation, primaryPasskey]);

  const handleOpenSocialAccount = useCallback(async value => {
    if (!value || !/^https?:\/\//i.test(value)) {
      return;
    }

    try {
      await Linking.openURL(value);
    } catch (error) {
      console.error('Error opening social account:', error);
    }
  }, []);

  const renderSocialAccountIcon = account => {
    if (account.iconSet === 'fontawesome6') {
      return (
        <FontAwesome6
          name={account.icon}
          size={18}
          color={themeVariables.blackColor}
        />
      );
    }

    return <Ionicons name={account.icon} size={20} color={themeVariables.blackColor} />;
  };

  const handleLogout = async () => {
    await logout();
    const rootNav = getRootNavigation();
    rootNav?.dispatch?.(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Welcome' }],
      }),
    );
  };

  const handleConfirmDelete = async () => {
    if (deleteText === 'DELETE') {
      try {
        await deleteAccount(user.id, token);
        await logout();
        const rootNav = getRootNavigation();
        rootNav?.dispatch?.(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Welcome' }],
          }),
        );
      } catch (error) {
        console.error('Error deleting account:', error);
        Alert.alert('Error', 'Could not delete account. Please try again.');
      } finally {
        setDeleteModalVisible(false);
        setDeleteText('');
      }
    } else {
      Alert.alert('Confirmation Required', 'Please enter "DELETE" exactly to confirm.');
    }
  };

  const openModal = () => setDeleteModalVisible(true);
  const closeModal = () => {
    setDeleteModalVisible(false);
    setDeleteText('');
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <View style={styles.section}>
        <Text style={styles.sectionHeading}>Login</Text>
        <TouchableOpacity
          style={styles.item}
          onPress={hasPasskeys ? handleViewPasskey : handleCreatePasskey}
          disabled={passkeyLoading || passkeysLoading}
        >
          <Ionicons name="key-outline" size={20} color={themeVariables.blackColor} />
          <Text style={styles.itemText}>Passkeys</Text>
          {passkeyLoading || passkeysLoading ? (
            <ActivityIndicator color={themeVariables.blackColor} size="small" />
          ) : (
            <Ionicons name="chevron-forward" size={18} color={themeVariables.blackColor} />
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('ChangePassword')}>
          <Ionicons name="lock-closed-outline" size={20} color={themeVariables.blackColor} />
          <Text style={styles.itemText}>Update Password</Text>
          <Ionicons name="chevron-forward" size={18} color={themeVariables.blackColor} />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeading}>Social Accounts</Text>
        {connectedSocialAccounts.length > 0 ? (
          connectedSocialAccounts.map(account => {
            const isLink = /^https?:\/\//i.test(account.value);
            const content = (
              <>
                {renderSocialAccountIcon(account)}
                <View style={styles.socialTextBlock}>
                  <Text style={styles.socialAccountLabel}>{account.label}</Text>
                  <Text style={styles.socialAccountValue} numberOfLines={1}>
                    {account.value}
                  </Text>
                </View>
                {isLink ? (
                  <Ionicons name="open-outline" size={18} color={themeVariables.blackColor} />
                ) : null}
              </>
            );

            return isLink ? (
              <TouchableOpacity
                key={account.key}
                style={styles.item}
                onPress={() => handleOpenSocialAccount(account.value)}
                activeOpacity={0.75}
              >
                {content}
              </TouchableOpacity>
            ) : (
              <View key={account.key} style={styles.item}>
                {content}
              </View>
            );
          })
        ) : (
          <View style={styles.item}>
            <Ionicons name="share-social-outline" size={20} color={themeVariables.blackColor} />
            <Text style={styles.itemText}>No social accounts connected</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeading}>Account</Text>
        <TouchableOpacity style={styles.item} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={themeVariables.blackColor} />
          <Text style={styles.itemText}>Logout</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.item} onPress={openModal}>
          <Ionicons name="trash-outline" size={20} color={themeVariables.redColor} />
          <Text style={[styles.itemText, styles.destructiveItemText]}>Delete My Account</Text>
        </TouchableOpacity>
      </View>

      <Modal animationType="fade" transparent visible={deleteModalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Confirm Account Deletion</Text>
            <Text style={styles.modalMessage}>Type "DELETE" to permanently delete your account.</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="DELETE"
              value={deleteText}
              onChangeText={setDeleteText}
              autoCapitalize="characters"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleConfirmDelete}
              >
                <Text style={styles.modalButtonText}>Confirm</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={closeModal}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeVariables.screenBackgroundColor,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  section: {
    backgroundColor: themeVariables.whiteColor,
    marginBottom: 18,
  },
  sectionHeading: {
    color: themeVariables.blackColor,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: themeVariables.borderLightColor,
  },
  itemText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 15,
    color: themeVariables.blackColor,
  },
  socialTextBlock: {
    flex: 1,
    marginLeft: 15,
    marginRight: 12,
  },
  socialAccountLabel: {
    color: themeVariables.blackColor,
    fontSize: 16,
  },
  socialAccountValue: {
    marginTop: 3,
    color: themeVariables.textMutedStrongColor || '#666',
    fontSize: 13,
  },
  destructiveItemText: {
    color: themeVariables.redColor,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    backgroundColor: themeVariables.whiteColor,
    borderRadius: 10,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: themeVariables.blackColor,
  },
  modalMessage: {
    fontSize: 14,
    marginBottom: 20,
    color: themeVariables.blackColor,
    textAlign: 'center',
  },
  modalInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: themeVariables.borderLightColor,
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 5,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: '#e74c3c',
    borderRadius: 20,
  },
  cancelButton: {
    backgroundColor: themeVariables.primaryColor,
    borderRadius: 20,
  },
  modalButtonText: {
    color: themeVariables.whiteColor,
    fontWeight: '600',
  },
});

export default Security;

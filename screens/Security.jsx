import React, { useContext, useEffect, useState } from 'react';
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
import { CommonActions } from '@react-navigation/native';

import { UserContext } from '../contexts/UserContext';
import { useAuthService } from '../services/AuthService';
import { PASSKEY_WEBSITE_PATH, WEB_APP_URL } from '../config';
import themeVariables from '../styles/theme';

const Security = ({ navigation }) => {
  const { user, token, logout } = useContext(UserContext);
  const { deleteAccount, createPasskey, isPasskeySupported, fetchPasskeyCredentials, deletePasskeyCredential } =
    useAuthService();
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteText, setDeleteText] = useState('');
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [passkeys, setPasskeys] = useState([]);
  const [passkeysLoading, setPasskeysLoading] = useState(false);
  const [removingPasskeyId, setRemovingPasskeyId] = useState(null);

  const baseWebSettingsUrl = `${WEB_APP_URL}${PASSKEY_WEBSITE_PATH}`;
  const userFirstName = typeof user?.firstName === 'string' && user.firstName.trim().length > 0
    ? user.firstName.trim()
    : 'My';

  const extractPasskeyCredentials = (payload) => {
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
  };

  const normalizePasskey = (passkey, index) => {
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
  };

  const loadPasskeys = async () => {
    if (!token) {
      setPasskeys([]);
      return;
    }

    setPasskeysLoading(true);
    try {
      const result = await fetchPasskeyCredentials();
      if (!result?.ok) {
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
  };

  const hasPasskeys = passkeys.length > 0;

  useEffect(() => {
    loadPasskeys();
  }, [token]);

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

  const handleDeletePasskey = async (passkey) => {
    if (!passkey?.id) {
      Alert.alert('Delete failed', 'This passkey is missing an identifier and cannot be removed.');
      return;
    }

    Alert.alert(
      'Delete Passkey',
      `Remove ${passkey.label} from your account?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setRemovingPasskeyId(passkey.id);
            try {
              const result = await deletePasskeyCredential(passkey.id);
              if (!result?.ok) {
                const nested = result?.data?.error || null;
                const message =
                  nested?.message || result?.data?.message || 'Could not delete this passkey.';
                Alert.alert('Delete failed', message);
                return;
              }

              await loadPasskeys();
            } catch (error) {
              console.error('Error deleting passkey:', error);
              Alert.alert('Delete failed', error?.message || 'Could not delete this passkey.');
            } finally {
              setRemovingPasskeyId(null);
            }
          },
        },
      ],
      { cancelable: true },
    );
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
        {!hasPasskeys ? (
          <TouchableOpacity style={styles.item} onPress={handleCreatePasskey} disabled={passkeyLoading}>
            <Ionicons name="key-outline" size={20} color={themeVariables.blackColor} />
            <Text style={styles.itemText}>Create Passkey</Text>
            {passkeyLoading ? <ActivityIndicator color={themeVariables.blackColor} size="small" /> : null}
          </TouchableOpacity>
        ) : null}

        <View style={styles.passkeySection}>
          <Text style={styles.passkeySectionTitle}>Passkey</Text>
          {passkeysLoading ? (
            <ActivityIndicator color={themeVariables.blackColor} size="small" style={styles.passkeyLoading} />
          ) : passkeys.length > 0 ? (
            <View style={styles.passkeyChips}>
              {passkeys.map(passkey => (
                <View key={passkey.id} style={styles.passkeyChip}>
                  <Text style={styles.passkeyChipText} numberOfLines={1}>
                    {passkey.label}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleDeletePasskey(passkey)}
                    disabled={removingPasskeyId === passkey.id}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    {removingPasskeyId === passkey.id ? (
                      <ActivityIndicator size="small" color={themeVariables.whiteColor} />
                    ) : (
                      <Ionicons name="close-circle" size={18} color={themeVariables.whiteColor} />
                    )}
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.passkeyEmptyText}>No passkeys added yet.</Text>
          )}
        </View>

        <TouchableOpacity style={styles.item} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={themeVariables.blackColor} />
          <Text style={styles.itemText}>Logout</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.item} onPress={openModal}>
          <Ionicons name="trash-outline" size={20} color={themeVariables.blackColor} />
          <Text style={styles.itemText}>Delete Account</Text>
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
  passkeySection: {
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: themeVariables.borderLightColor,
  },
  passkeySectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: themeVariables.blackColor,
    marginBottom: 10,
  },
  passkeyLoading: {
    alignSelf: 'flex-start',
  },
  passkeyChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  passkeyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: themeVariables.primaryColor,
    borderRadius: 999,
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: themeVariables.primaryColor,
    maxWidth: '100%',
  },
  passkeyChipText: {
    color: themeVariables.whiteColor,
    fontSize: 14,
    marginRight: 8,
    maxWidth: 220,
  },
  passkeyEmptyText: {
    fontSize: 14,
    color: '#666',
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

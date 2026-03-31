import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { useAuthService } from '../services/AuthService';
import themeVariables from '../styles/theme';

const formatPasskeyId = (value) => {
  const trimmed = String(value || '').trim();
  if (!trimmed) return 'Unavailable';
  return trimmed.match(/.{1,4}/g)?.join(' ') || trimmed;
};

const formatCreatedAt = (value) => {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleDateString();
};

const PasskeyDetails = ({ navigation, route }) => {
  const { deletePasskeyCredential } = useAuthService();
  const [deleting, setDeleting] = useState(false);

  const passkey = route?.params?.passkey || null;
  const passkeyId = passkey?.id || passkey?.credentialId || passkey?.raw?.credentialId || '';
  const createdAtLabel = formatCreatedAt(passkey?.createdAt || passkey?.raw?.createdAt || passkey?.raw?.created_at);

  const formattedPasskeyId = useMemo(() => formatPasskeyId(passkeyId), [passkeyId]);

  const handleDeletePasskey = () => {
    if (!passkeyId) {
      Alert.alert('Delete failed', 'This passkey is missing an identifier and cannot be removed.');
      return;
    }

    Alert.alert(
      'Delete Passkey',
      'Remove this passkey from your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              const result = await deletePasskeyCredential(passkeyId);
              if (!result?.ok) {
                const nested = result?.data?.error || null;
                const message =
                  nested?.message || result?.data?.message || 'Could not delete this passkey.';
                Alert.alert('Delete failed', message);
                return;
              }

              Alert.alert('Passkey Deleted', 'Your passkey has been removed.', [
                {
                  text: 'OK',
                  onPress: () => navigation.goBack(),
                },
              ]);
            } catch (error) {
              console.error('Error deleting passkey:', error);
              Alert.alert('Delete failed', error?.message || 'Could not delete this passkey.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
      { cancelable: true },
    );
  };

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
      <View style={styles.content}>
        <View style={styles.centerBlock}>
          <View style={styles.heroCard}>
            <View style={styles.iconWrap}>
              <Ionicons name="key-outline" size={30} color={themeVariables.primaryColor} />
            </View>

            <Text style={styles.title}>Passkey Details</Text>
            <Text style={styles.subtitle}>Use this passkey to sign in securely on this device.</Text>

            <View style={styles.credentialCard}>
              <Text style={styles.cardLabel}>Credential ID</Text>
              <Text style={styles.cardValue} selectable>
                {formattedPasskeyId}
              </Text>
              {createdAtLabel ? <Text style={styles.cardMeta}>Created {createdAtLabel}</Text> : null}
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.deleteButton, deleting ? styles.deleteButtonDisabled : null]}
          onPress={handleDeletePasskey}
          disabled={deleting}
          activeOpacity={0.88}
        >
          {deleting ? (
            <ActivityIndicator color={themeVariables.whiteColor} size="small" />
          ) : (
            <>
              <Ionicons name="trash-outline" size={18} color={themeVariables.whiteColor} />
              <Text style={styles.deleteButtonText}>Delete Passkey</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: themeVariables.screenBackgroundColor,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  centerBlock: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: themeVariables.whiteColor,
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  iconWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(240,240,240,0.8)',
    borderWidth: 1,
    borderColor: 'rgba(200,200,200,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: 'rgba(255,255,255,0.5)',
    shadowOpacity: 0.6,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: themeVariables.blackColor,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: '#6C7690',
    textAlign: 'center',
    maxWidth: 320,
    marginBottom: 24,
  },
  credentialCard: {
    width: '100%',
    backgroundColor: '#F8FAFF',
    borderWidth: 1,
    borderColor: '#E2E8F4',
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 20,
    alignItems: 'center',
  },
  cardLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: themeVariables.blackColor,
    marginBottom: 10,
  },
  cardValue: {
    fontSize: 18,
    lineHeight: 28,
    textAlign: 'center',
    color: themeVariables.blackColor,
    letterSpacing: 1.1,
  },
  cardMeta: {
    fontSize: 14,
    color: '#6C7690',
    marginTop: 16,
    textAlign: 'center',
  },
  deleteButton: {
    minHeight: 52,
    minWidth: 240,
    paddingHorizontal: 24,
    borderRadius: 999,
    backgroundColor: themeVariables.redColor,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 8,
  },
  deleteButtonDisabled: {
    opacity: 0.7,
  },
  deleteButtonText: {
    color: themeVariables.whiteColor,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
});

export default PasskeyDetails;

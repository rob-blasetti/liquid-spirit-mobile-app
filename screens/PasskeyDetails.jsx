import React, { useMemo, useState } from 'react';
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
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { useTheme } from '../contexts/ThemeContext';
import { useAuthService } from '../services/AuthService';
import themeVariables from '../styles/theme';

const WHITE_ICON_COLOR = '#FFFFFF';

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
  const { isDarkMode } = useTheme();
  const [deleting, setDeleting] = useState(false);
  const tabBarHeight = useBottomTabBarHeight();

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
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.heroCard, isDarkMode && styles.heroCardDark]}>
          <View style={[styles.iconWrap, isDarkMode && styles.iconWrapDark]}>
            <Ionicons
              name="key-outline"
              size={30}
              color={isDarkMode ? WHITE_ICON_COLOR : themeVariables.primaryColor}
            />
          </View>

          <Text style={[styles.title, isDarkMode && styles.titleDark]}>Passkey Details</Text>
          <Text style={[styles.subtitle, isDarkMode && styles.subtitleDark]}>
            Use this passkey to sign in securely on this device.
          </Text>

          <View style={[styles.credentialCard, isDarkMode && styles.credentialCardDark]}>
            <Text style={[styles.cardLabel, isDarkMode && styles.cardLabelDark]}>
              Credential ID
            </Text>
            <Text style={[styles.cardValue, isDarkMode && styles.cardValueDark]} selectable>
              {formattedPasskeyId}
            </Text>
            {createdAtLabel ? (
              <Text style={[styles.cardMeta, isDarkMode && styles.cardMetaDark]}>
                Created {createdAtLabel}
              </Text>
            ) : null}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.deleteButton, deleting ? styles.deleteButtonDisabled : null]}
          onPress={handleDeletePasskey}
          disabled={deleting}
          activeOpacity={0.88}
        >
          {deleting ? (
            <ActivityIndicator color={WHITE_ICON_COLOR} size="small" />
          ) : (
            <>
              <Ionicons name="trash-outline" size={18} color={WHITE_ICON_COLOR} />
              <Text style={styles.deleteButtonText}>Delete Passkey</Text>
            </>
          )}
        </TouchableOpacity>
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
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
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
    marginBottom: 24,
  },
  heroCardDark: {
    backgroundColor: themeVariables.surfaceDark2Color,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    shadowOpacity: 0,
    elevation: 0,
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
  iconWrapDark: {
    backgroundColor: 'rgba(141, 156, 255, 0.2)',
    borderColor: 'rgba(255, 255, 255, 0.22)',
    shadowOpacity: 0,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: themeVariables.blackColor,
    textAlign: 'center',
    marginBottom: 8,
  },
  titleDark: {
    color: themeVariables.textSoftInverseColor,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: '#6C7690',
    textAlign: 'center',
    maxWidth: 320,
    marginBottom: 24,
  },
  subtitleDark: {
    color: 'rgba(241, 244, 255, 0.72)',
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
  credentialCardDark: {
    backgroundColor: themeVariables.surfaceDark3Color,
    borderColor: 'rgba(255, 255, 255, 0.24)',
  },
  cardLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: themeVariables.blackColor,
    marginBottom: 10,
  },
  cardLabelDark: {
    color: themeVariables.textSoftInverseColor,
  },
  cardValue: {
    fontSize: 18,
    lineHeight: 28,
    textAlign: 'center',
    color: themeVariables.blackColor,
    letterSpacing: 1.1,
  },
  cardValueDark: {
    color: themeVariables.textSoftInverseColor,
  },
  cardMeta: {
    fontSize: 14,
    color: '#6C7690',
    marginTop: 16,
    textAlign: 'center',
  },
  cardMetaDark: {
    color: 'rgba(241, 244, 255, 0.62)',
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
    alignSelf: 'center',
  },
  deleteButtonDisabled: {
    opacity: 0.7,
  },
  deleteButtonText: {
    color: WHITE_ICON_COLOR,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
});

export default PasskeyDetails;

import React, { useCallback, useContext, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { UserContext } from '../contexts/UserContext';
import { updateHouseholdSelfSettings } from '../services/HouseholdService';
import themeVariables from '../styles/theme';

const getEntityId = value => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return String(value._id || value.id || '');
};

const getUserId = user => String(user?._id || user?.id || '');

const formatPersonName = person => {
  const name = [person?.firstName, person?.lastName].filter(Boolean).join(' ').trim();
  return name || 'Assigned';
};

const HouseholdSettings = ({ route }) => {
  const {
    user,
    token,
    householdSettings,
    setHouseholdSettings,
    refreshHouseholdSettings,
  } = useContext(UserContext);
  const initialHousehold = route?.params?.household || householdSettings || null;
  const hasDisplayDataRef = useRef(Boolean(initialHousehold));
  const [household, setHousehold] = useState(initialHousehold);
  const [loading, setLoading] = useState(!initialHousehold);
  const [savingResidence, setSavingResidence] = useState(false);
  const [error, setError] = useState('');

  const userId = getUserId(user);
  const householdId = getEntityId(household);
  const primaryContactId = getEntityId(household?.primaryContact);
  const hasPrimaryContact = Boolean(primaryContactId);
  const isPrimaryContact = Boolean(userId && primaryContactId && userId === primaryContactId);
  const canManageResidence = Boolean(householdId && isPrimaryContact);
  const residenceSelectable = Boolean(household?.acceptVenueRequest);

  const loadHousehold = useCallback(async () => {
    if (!token || !userId) {
      setLoading(false);
      setHousehold(null);
      return;
    }

    if (!hasDisplayDataRef.current) {
      setLoading(true);
    }
    setError('');
    try {
      const data = await refreshHouseholdSettings();
      hasDisplayDataRef.current = Boolean(data);
      setHousehold(data);
    } catch (loadError) {
      const message = loadError?.status === 404
        ? 'No household is linked to your account yet.'
        : loadError?.message || 'Could not load household settings.';
      if (!hasDisplayDataRef.current) {
        setError(message);
        setHousehold(null);
      }
    } finally {
      setLoading(false);
    }
  }, [refreshHouseholdSettings, token, userId]);

  useFocusEffect(useCallback(() => {
    loadHousehold();
  }, [loadHousehold]));

  const applyHouseholdPatch = async (patch) => {
    if (!householdId || !token) return null;
    const updated = await updateHouseholdSelfSettings(householdId, patch, token);
    setHousehold(updated);
    setHouseholdSettings(updated?.primaryContact ? updated : null);
    return updated;
  };

  const handleResidenceSelectableChange = async (nextValue) => {
    if (!canManageResidence) return;

    setSavingResidence(true);
    try {
      await applyHouseholdPatch({ acceptVenueRequest: nextValue });
    } catch (saveError) {
      Alert.alert(
        'Household update failed',
        saveError?.message || 'Could not update residence venue requests.',
      );
    } finally {
      setSavingResidence(false);
    }
  };

  const primaryStatusText = isPrimaryContact
    ? 'You are the primary contact'
    : hasPrimaryContact
      ? `${formatPersonName(household?.primaryContact)} is the primary contact`
      : 'No primary contact assigned';
  const primaryContactName = formatPersonName(household?.primaryContact);
  const residenceHelperText = canManageResidence
    ? 'Allow your residence to appear as an option when your household is part of a venue request.'
    : `Only ${primaryContactName} can make the residence selectable for venue requests.`;

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={themeVariables.primaryColor} />
          </View>
        ) : error ? (
          <View style={styles.stateContainer}>
            <Ionicons name="home-outline" size={22} color={themeVariables.blackColor} />
            <Text style={styles.stateText}>{error}</Text>
          </View>
        ) : !hasPrimaryContact ? (
          <View style={styles.stateContainer}>
            <Ionicons name="home-outline" size={22} color={themeVariables.blackColor} />
            <Text style={styles.stateText}>Household primary contact has not been assigned.</Text>
          </View>
        ) : (
          <View style={styles.section}>
            <View style={styles.item}>
              <Ionicons name="person-circle-outline" size={20} color={themeVariables.blackColor} />
              <View style={styles.itemTextBlock}>
                <Text style={styles.itemTitle}>Primary Contact</Text>
                <Text style={styles.itemDescription}>{primaryStatusText}</Text>
              </View>
              <Ionicons
                name={isPrimaryContact ? 'checkmark-circle-outline' : 'lock-closed-outline'}
                size={20}
                color={themeVariables.blackColor}
              />
            </View>

            <View style={styles.item}>
              <Ionicons name="home-outline" size={20} color={themeVariables.blackColor} />
              <View style={styles.itemTextBlock}>
                <Text style={styles.itemTitle}>Residence Venue Requests</Text>
                <Text style={styles.itemDescription}>{residenceHelperText}</Text>
              </View>
              {savingResidence ? (
                <ActivityIndicator color={themeVariables.blackColor} size="small" />
              ) : (
                <Switch
                  value={residenceSelectable}
                  onValueChange={handleResidenceSelectableChange}
                  disabled={!canManageResidence}
                  trackColor={{
                    false: themeVariables.borderMutedColor,
                    true: themeVariables.primaryLightColor,
                  }}
                  thumbColor={
                    residenceSelectable ? themeVariables.primaryColor : themeVariables.whiteColor
                  }
                  ios_backgroundColor={themeVariables.borderMutedColor}
                />
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeVariables.screenBackgroundColor,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  section: {
    marginBottom: 0,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: themeVariables.whiteColor,
    padding: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: themeVariables.borderLightColor,
  },
  itemTextBlock: {
    flex: 1,
    marginLeft: 15,
    marginRight: 12,
  },
  itemTitle: {
    color: themeVariables.blackColor,
    fontSize: 16,
  },
  itemDescription: {
    color: themeVariables.textMutedStrongColor || '#666',
    fontSize: 13,
    marginTop: 4,
  },
  loadingContainer: {
    paddingVertical: 36,
    alignItems: 'center',
  },
  stateContainer: {
    alignItems: 'center',
    backgroundColor: themeVariables.whiteColor,
    padding: 20,
  },
  stateText: {
    color: themeVariables.blackColor,
    fontSize: 15,
    marginTop: 10,
    textAlign: 'center',
  },
});

export default HouseholdSettings;

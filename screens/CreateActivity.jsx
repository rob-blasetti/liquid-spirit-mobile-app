import React, { useEffect, useRef, useState, useContext, useMemo, useCallback } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform, StyleSheet, Animated, Text, TouchableOpacity } from 'react-native';
import { TextInput, Title, HelperText, Snackbar, Avatar } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { launchImageLibrary } from 'react-native-image-picker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Button } from 'liquid-spirit-styleguide/native';
import themeVariables from '../styles/theme';
import DropdownInput from '../components/forms/inputs/DropdownInput';
import MultiSelectMemberInput from '../components/forms/inputs/MultiSelectMemberInput';

import { UserContext } from '../contexts/UserContext';
import { createActivity } from '../services/ActivityService';
import { getMemberList } from '../services/UserService';

const TOTAL_STEPS = 5;
const ACTIVITY_TYPES = [
  "Children's Class",
  'Junior Youth Group',
  'Study Circle',
  'Devotional',
  'Independent Initiative',
  'Fireside',
];
const WEEK_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const FREQUENCY_OPTIONS = ['Weekly', 'Bi-Weekly', 'Monthly', 'One-Off'];
const AU_STATES = ['VIC', 'QLD', 'NSW', 'ACT', 'NT', 'TAS', 'WA', 'SA'];

const normalizeMemberEntries = payload => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.memberDetails)) return payload.memberDetails;
  if (Array.isArray(payload?.data?.memberDetails)) return payload.data.memberDetails;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const isUserMemberEntry = entry => {
  if (!entry || typeof entry !== 'object') return false;
  const candidate =
    entry.details ||
    entry.user ||
    entry.profile ||
    entry.account ||
    entry.member ||
    entry.refId ||
    entry.ref ||
    entry.reference ||
    entry;

  const typeCandidates = [
    entry.type,
    entry.entityType,
    entry.memberType,
    entry.referenceType,
    entry.refType,
    entry.targetType,
    candidate?.type,
    candidate?.entityType,
    candidate?.memberType,
  ];

  return typeCandidates.some(value => {
    if (!value || typeof value !== 'string') return false;
    const normalized = value.trim().toLowerCase();
    return normalized === 'user';
  });
};

const normalizeMemberRecord = entry => {
  if (!entry) return null;
  const candidate =
    entry.details ||
    entry.profile ||
    entry.user ||
    entry.account ||
    entry.member ||
    entry.refId ||
    entry.ref ||
    entry.reference ||
    entry;

  const id =
    candidate?._id ||
    candidate?.id ||
    candidate?.userId ||
    candidate?.user_id ||
    entry?._id ||
    entry?.id ||
    null;

  if (!id) return null;

  const firstName =
    entry.fullName ||
    candidate?.fullName ||
    candidate?.firstName ||
    candidate?.first_name ||
    entry.firstName ||
    entry.first_name ||
    '';

  const lastName =
    candidate?.lastName ||
    candidate?.last_name ||
    entry.lastName ||
    entry.last_name ||
    '';

  const email = candidate?.email || entry.email || '';

  const profilePicture =
    candidate?.profilePicture ||
    candidate?.avatar ||
    candidate?.photo ||
    entry?.profilePicture ||
    entry?.avatar ||
    entry?.photo ||
    '';

  return {
    _id: String(id),
    firstName,
    lastName,
    fullName: [firstName, lastName].filter(Boolean).join(' ').trim() || firstName || lastName || email,
    email,
    profilePicture,
  };
};

const filterMembers = (members, query, selected) => {
  const normalizedQuery = query.trim().toLowerCase();
  const exclude = new Set(selected.map(entry => String(entry._id || entry.id)));
  return members
    .filter(member => !exclude.has(String(member._id || member.id)))
    .filter(member => {
      if (!normalizedQuery) return true;
      const haystack = [
        member.fullName,
        member.firstName,
        member.lastName,
        member.email,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    })
    .slice(0, 6);
};

const formatTimeValue = dateObj => {
  if (!(dateObj instanceof Date)) return '';
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const combineDateTime = (dateObj, timeObj) => {
  if (!(dateObj instanceof Date)) return null;
  const combined = new Date(dateObj);
  if (timeObj instanceof Date) {
    combined.setHours(timeObj.getHours());
    combined.setMinutes(timeObj.getMinutes());
    combined.setSeconds(0, 0);
  }
  return combined;
};

export default function CreateActivity({ navigation, route }) {
  // communityId + userId come via route params
  const communityId = route.params.communityId;
  const userId = route.params.userId;
  const { token } = useContext(UserContext);

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    title: '',
    description: '',
    date: null,
    time: null,
    groupDay: '',
    frequency: 'Weekly',
    facilitatorLimit: '',
    participantLimit: '',
    facilitators: [],
    participants: [],
    onlineLink: '',
    address: {
      streetAddress: '',
      suburb: '',
      city: '',
      state: '',
      postalCode: '',
    },
    imageUrl: '',
    activityType: '',
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });
  const progressAnim = useRef(new Animated.Value(1 / TOTAL_STEPS)).current;
  const [members, setMembers] = useState([]);
  const [memberLoading, setMemberLoading] = useState(false);
  const [memberError, setMemberError] = useState('');
  const [facilitatorQuery, setFacilitatorQuery] = useState('');
  const [participantQuery, setParticipantQuery] = useState('');

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: step / TOTAL_STEPS,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [step, progressAnim]);

  useEffect(() => {
    if (!communityId) return;
    let cancelled = false;
    const loadMembers = async () => {
      setMemberLoading(true);
      setMemberError('');
      try {
        const response = await getMemberList(communityId);
        if (cancelled) return;
        const normalized = normalizeMemberEntries(response)
          .filter(isUserMemberEntry)
          .map(normalizeMemberRecord)
          .filter(Boolean);
        setMembers(normalized);
      } catch (error) {
        if (!cancelled) {
          setMemberError(error?.message || 'Unable to load community members.');
        }
      } finally {
        if (!cancelled) {
          setMemberLoading(false);
        }
      }
    };
    loadMembers();
    return () => {
      cancelled = true;
    };
  }, [communityId]);

  const facilitatorOptions = useMemo(
    () => filterMembers(members, facilitatorQuery, form.facilitators),
    [members, facilitatorQuery, form.facilitators],
  );

  const participantOptions = useMemo(
    () => filterMembers(members, participantQuery, form.participants),
    [members, participantQuery, form.participants],
  );

  const handleAddFacilitator = useCallback(
    member => {
      if (!member) return;
      setForm(prev => ({
        ...prev,
        facilitators: [...prev.facilitators, member],
      }));
      setFacilitatorQuery('');
    },
    [],
  );

  const handleRemoveFacilitator = useCallback(memberId => {
    setForm(prev => ({
      ...prev,
      facilitators: prev.facilitators.filter(entry => (entry?._id || entry?.id) !== memberId),
    }));
  }, []);

  const handleAddParticipant = useCallback(
    member => {
      if (!member) return;
      setForm(prev => ({
        ...prev,
        participants: [...prev.participants, member],
      }));
      setParticipantQuery('');
    },
    [],
  );

  const handleRemoveParticipant = useCallback(memberId => {
    setForm(prev => ({
      ...prev,
      participants: prev.participants.filter(entry => (entry?._id || entry?.id) !== memberId),
    }));
  }, []);

  const handleSelectActivityType = useCallback(value => {
    setForm(prev => ({
      ...prev,
      activityType: value,
    }));
  }, []);

  const handleSelectDay = useCallback(value => {
    setForm(prev => ({
      ...prev,
      groupDay: value,
    }));
  }, []);

  const handleSelectFrequency = useCallback(value => {
    setForm(prev => ({
      ...prev,
      frequency: value,
    }));
  }, []);

  const handleSelectState = useCallback(value => {
    setForm(prev => ({
      ...prev,
      address: { ...prev.address, state: value },
    }));
  }, []);

  // Validation stub
  const validateStep = () => {
    const e = {};
    if (step === 1) {
      if (!form.title) e.title = 'Required';
      if (!form.activityType) e.activityType = 'Please select an activity type';
    }
    if (step === 2) {
      if (!form.groupDay) e.groupDay = 'Choose a day of the week';
      if (!form.date) e.date = 'Select a date';
      if (!form.time) e.time = 'Select a time';
    }
    if (step === 3 && form.onlineLink && !form.onlineLink.startsWith('http')) e.onlineLink = 'Must start with http:// or https://';
    // ...other step-specific checks
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onNext = () => {
    if (validateStep()) {
      setStep((s) => Math.min(s + 1, TOTAL_STEPS));
    }
  };
  const onBack = () => setStep((s) => Math.max(s - 1, 1));

  const pickImage = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.7,
    };
    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        return;
      } else if (response.errorCode) {
        setSnackbar({ visible: true, message: response.errorMessage || 'Image picker error' });
      } else if (response.assets && response.assets.length > 0) {
        const asset = response.assets[0];
        setForm({ ...form, imageUrl: asset.uri });
      }
    });
  };

  const onSubmit = async () => {
    // Assemble payload
    const facilitatorEntries = form.facilitators
      .map(member => {
        const id = member?._id || member?.id;
        return id ? { _id: id } : null;
      })
      .filter(Boolean);
    const participantEntries = form.participants
      .map(member => {
        const id = member?._id || member?.id;
        return id ? { _id: id } : null;
      })
      .filter(Boolean);
    const sessionDateValue = combineDateTime(form.date, form.time);
    const groupTimeValue = formatTimeValue(form.time);
    const facilitatorLimitValue = form.facilitatorLimit ? Number(form.facilitatorLimit) : undefined;
    const participantLimitValue = form.participantLimit ? Number(form.participantLimit) : undefined;
    const payload = {
      title: form.title,
      description: form.description,
      sessionDate: sessionDateValue ? sessionDateValue.toISOString() : null,
      groupDetails: {
        day: form.groupDay || null,
        frequency: form.frequency,
        time: groupTimeValue || null,
      },
      onlineLink: form.onlineLink,
      address: form.address,
      imageUrl: form.imageUrl,
      activityType: form.activityType,
      facilitators: facilitatorEntries,
      participants: participantEntries,
      community: communityId,
      createdBy: userId,
      facilitatorLimit: Number.isFinite(facilitatorLimitValue) ? facilitatorLimitValue : undefined,
      participantLimit: Number.isFinite(participantLimitValue) ? participantLimitValue : undefined,
    };
    try {
      await createActivity(payload, token);
      setSnackbar({ visible: true, message: 'Activity created!' });
      navigation.goBack();
    } catch (err) {
      console.error('CreateActivity error:', err);
      setSnackbar({ visible: true, message: err.message || 'Error creating activity.' });
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.select({ ios: 'padding', android: null })}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.progressHeader}>
          <Title style={styles.title}>Create Activity</Title>
          <Text style={styles.stepIndicator}>Step {step} of {TOTAL_STEPS}</Text>
        </View>
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>

        <View style={styles.formCard}>
          {step === 1 && (
            <>
              <TextInput
                label="Title *"
                mode="outlined"
                value={form.title}
                onChangeText={(text) => setForm({ ...form, title: text })}
                error={!!errors.title}
                style={styles.input}
              />
              <HelperText type="error" visible={!!errors.title}>
                {errors.title}
              </HelperText>

              <DropdownInput
                label="Activity Type *"
                value={form.activityType}
                options={ACTIVITY_TYPES}
                placeholder="Select activity type"
                onSelect={handleSelectActivityType}
                error={errors.activityType}
              />

              <TextInput
                label="Description"
                mode="outlined"
                value={form.description}
                multiline
                numberOfLines={3}
                onChangeText={(text) => setForm({ ...form, description: text })}
              />
            </>
          )}

          {step === 2 && (
            <>
              <DropdownInput
                label="Day of Week *"
                value={form.groupDay}
                options={WEEK_DAYS}
                placeholder="Select a day"
                onSelect={handleSelectDay}
                error={errors.groupDay}
              />

              <Button
                secondary
                size="medium"
                label={form.date ? form.date.toDateString() : 'Select Date'}
                onPress={() => setShowDatePicker(true)}
                style={styles.fullWidthButton}
              />
              <HelperText type="error" visible={!!errors.date}>
                {errors.date}
              </HelperText>
              {showDatePicker && (
                <DateTimePicker
                  value={form.date || new Date()}
                  mode="date"
                  display="default"
                  onChange={(_, date) => {
                    setShowDatePicker(false);
                    if (date) setForm({ ...form, date });
                  }}
                />
              )}

              <Button
                secondary
                size="medium"
                label={form.time ? form.time.toLocaleTimeString() : 'Select Time'}
                onPress={() => setShowTimePicker(true)}
                style={[styles.fullWidthButton, styles.controlSpacing]}
              />
              {showTimePicker && (
                <DateTimePicker
                  value={form.time || new Date()}
                  mode="time"
                  display="default"
                  onChange={(_, time) => {
                    setShowTimePicker(false);
                    if (time) setForm({ ...form, time });
                  }}
                />
              )}
              <HelperText type="error" visible={!!errors.time}>
                {errors.time}
              </HelperText>

              <Title style={styles.sectionLabel}>Frequency</Title>
              <DropdownInput
                label="Meeting Frequency *"
                value={form.frequency}
                options={FREQUENCY_OPTIONS}
                placeholder="Select frequency"
                onSelect={handleSelectFrequency}
              />
            </>
          )}

          {step === 3 && (
            <>
              <TextInput
                label="Online Link"
                mode="outlined"
                value={form.onlineLink}
                onChangeText={(text) => setForm({ ...form, onlineLink: text })}
                error={!!errors.onlineLink}
              />
              <HelperText type="error" visible={!!errors.onlineLink}>
                {errors.onlineLink}
              </HelperText>
              <Title style={styles.sectionLabel}>Or pick a location below</Title>
              <TextInput
                label="Street Address"
                mode="outlined"
                value={form.address.streetAddress}
                onChangeText={(t) => setForm({ ...form, address: { ...form.address, streetAddress: t } })}
              />
              <TextInput
                label="Suburb"
                mode="outlined"
                value={form.address.suburb}
                onChangeText={(t) => setForm({ ...form, address: { ...form.address, suburb: t } })}
              />
              <TextInput
                label="City"
                mode="outlined"
                value={form.address.city}
                onChangeText={(t) => setForm({ ...form, address: { ...form.address, city: t } })}
              />
              <DropdownInput
                label="State"
                value={form.address.state}
                options={AU_STATES}
                placeholder="Select state"
                onSelect={handleSelectState}
              />
              <TextInput
                label="Postal Code"
                mode="outlined"
                value={form.address.postalCode}
                onChangeText={(t) => setForm({ ...form, address: { ...form.address, postalCode: t } })}
                keyboardType="number-pad"
              />
            </>
          )}

          {step === 4 && (
            <>
              <View style={styles.limitRow}>
                <TextInput
                  label="Facilitator Limit"
                  mode="outlined"
                  keyboardType="number-pad"
                  style={[styles.input, styles.limitInput]}
                  value={form.facilitatorLimit}
                  onChangeText={text => {
                    const sanitized = text.replace(/[^0-9]/g, '');
                    setForm(prev => ({ ...prev, facilitatorLimit: sanitized }));
                  }}
                />
                <TextInput
                  label="Participant Limit"
                  mode="outlined"
                  keyboardType="number-pad"
                  style={[styles.input, styles.limitInput, { marginRight: 0 }]}
                  value={form.participantLimit}
                  onChangeText={text => {
                    const sanitized = text.replace(/[^0-9]/g, '');
                    setForm(prev => ({ ...prev, participantLimit: sanitized }));
                  }}
                />
              </View>

              <MultiSelectMemberInput
                label="Facilitators"
                selected={form.facilitators}
                onRemove={handleRemoveFacilitator}
                searchValue={facilitatorQuery}
                onChangeSearch={setFacilitatorQuery}
                options={facilitatorOptions}
                onSelectOption={handleAddFacilitator}
                loading={memberLoading}
                error={memberError}
              />

              <MultiSelectMemberInput
                label="Participants"
                selected={form.participants}
                onRemove={handleRemoveParticipant}
                searchValue={participantQuery}
                onChangeSearch={setParticipantQuery}
                options={participantOptions}
                onSelectOption={handleAddParticipant}
                loading={memberLoading}
                error={memberError}
                style={styles.sectionDivider}
              />
            </>
          )}

          {step === 5 && (
            <>
              <Title>Cover Image</Title>
              <TouchableOpacity
                style={form.imageUrl ? styles.imagePreview : styles.imagePicker}
                onPress={pickImage}
                activeOpacity={0.8}
              >
                {form.imageUrl ? (
                  <>
                    <View style={styles.imagePreviewWrapper}>
                      <Avatar.Image size={140} source={{ uri: form.imageUrl }} />
                      <View style={styles.imageEditBadge}>
                        <Ionicons name="create-outline" size={14} color="#fff" />
                      </View>
                    </View>
                    <Text style={styles.imagePickerText}>Change Image</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="camera-outline" size={36} color={themeVariables.primaryColor} />
                    <Text style={styles.imagePickerText}>Add Cover Image</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={styles.buttons}>
          {step > 1 ? (
            <Button
              secondary
              size="large"
              label="Back"
              onPress={onBack}
              style={[styles.actionButton, styles.secondaryActionButton]}
            />
          ) : (
            <View style={styles.buttonSpacer} />
          )}
          {step < TOTAL_STEPS ? (
            <Button
              primary
              size="large"
              label="Next"
              onPress={onNext}
              style={[styles.actionButton, styles.primaryActionButton]}
            />
          ) : (
            <Button
              primary
              size="large"
              label="Create"
              onPress={onSubmit}
              style={[styles.actionButton, styles.primaryActionButton]}
            />
          )}
        </View>

        <Snackbar
          visible={snackbar.visible}
          onDismiss={() => setSnackbar({ visible: false, message: '' })}
          duration={2000}
        >
          {snackbar.message}
        </Snackbar>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
    backgroundColor: themeVariables.screenBackgroundColor,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    marginBottom: 0,
    color: themeVariables.blackColor,
  },
  stepIndicator: {
    fontSize: 14,
    fontWeight: '600',
    color: themeVariables.darkGreyColor || '#757575',
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: themeVariables.borderLightColor || '#e5e5e5',
    overflow: 'hidden',
    marginBottom: 24,
  },
  progressBar: {
    height: '100%',
    backgroundColor: themeVariables.primaryColor,
    borderRadius: 4,
  },
  formCard: {
    backgroundColor: themeVariables.whiteColor,
    borderRadius: 16,
    padding: 16,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    paddingHorizontal: 4,
  },
  actionButton: {
    flex: 1,
  },
  primaryActionButton: {
    marginLeft: 12,
  },
  secondaryActionButton: {
    marginRight: 12,
  },
  buttonSpacer: {
    flex: 1,
    marginRight: 12,
  },
  input: {
    marginBottom: 8,
  },
  fullWidthButton: {
    marginTop: 4,
  },
  controlSpacing: {
    marginTop: 12,
  },
  sectionLabel: {
    marginTop: 20,
    color: themeVariables.blackColor,
  },
  sectionDivider: {
    marginTop: 24,
  },
  imagePicker: {
    marginTop: 12,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 24,
    alignItems: 'center',
    borderColor: themeVariables.primaryColor,
  },
  imagePickerText: {
    marginTop: 8,
    color: themeVariables.primaryColor,
    fontWeight: '600',
  },
  imagePreview: {
    marginTop: 12,
    alignItems: 'center',
  },
  imagePreviewWrapper: {
    position: 'relative',
  },
  imageEditBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: themeVariables.primaryColor,
    padding: 6,
    borderRadius: 20,
  },
  limitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  limitInput: {
    flex: 1,
    marginRight: 8,
  },
});

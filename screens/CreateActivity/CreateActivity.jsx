import React, { useEffect, useRef, useState, useContext, useMemo, useCallback, useLayoutEffect } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform, StyleSheet, Animated, Text, TouchableOpacity, BackHandler } from 'react-native';
import { Title, Snackbar } from 'react-native-paper';
import { launchImageLibrary } from 'react-native-image-picker';
import { Button } from 'liquid-spirit-styleguide/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import themeVariables from '../../styles/theme';
import Ionicons from 'react-native-vector-icons/Ionicons';
import TitleSection from './sections/TitleSection';
import ActivityTypeSection from './sections/ActivityTypeSection';
import DescriptionSection from './sections/DescriptionSection';
import FrequencySection from './sections/FrequencySection';
import DateSection from './sections/DateSection';
import TimeSection from './sections/TimeSection';
import LocationSection from './sections/LocationSection';
import CoverImageSection from './sections/CoverImageSection';

import { UserContext } from '../../contexts/UserContext';
import { createActivity } from '../../services/ActivityService';

const TOTAL_STEPS = 3;
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

const TAB_BAR_HEIGHT = 80;

export default function CreateActivity({ navigation, route }) {
  // communityId + userId come via route params
  const communityId = route.params.communityId;
  const userId = route.params.userId;
  const { token } = useContext(UserContext);

  const [step, setStep] = useState(1);
  const inputTheme = useMemo(
    () => ({
      roundness: 4,
      colors: {
        background: '#f9f9f9',
        surface: '#f9f9f9',
        primary: themeVariables.primaryColor,
        text: themeVariables.blackColor,
        placeholder: themeVariables.darkGreyColor || '#777',
        outline: '#ddd',
      },
    }),
    [],
  );
  const baseInputProps = useMemo(
    () => ({
      mode: 'outlined',
      theme: inputTheme,
      outlineColor: '#ddd',
      activeOutlineColor: themeVariables.primaryColor,
      contentStyle: styles.inputContent,
      outlineStyle: styles.inputOutline,
    }),
    [inputTheme],
  );
  const styledInputProps = useMemo(
    () => ({
      ...baseInputProps,
      style: styles.input,
    }),
    [baseInputProps],
  );
  const [form, setForm] = useState({
    title: '',
    description: '',
    date: null,
  time: null,
    groupDay: '',
    frequency: 'Weekly',
    locationMode: 'online',
    onlineLink: 'https://',
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
  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });
  const progressAnim = useRef(new Animated.Value(1 / TOTAL_STEPS)).current;
  const { bottom: bottomInset } = useSafeAreaInsets();
  const scrollContentStyle = useMemo(
    () => [
      styles.container,
      { paddingBottom: Math.max(bottomInset + TAB_BAR_HEIGHT, 160) },
    ],
    [bottomInset],
  );

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: step / TOTAL_STEPS,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [step, progressAnim]);

  const handleSelectActivityType = useCallback(value => {
    setForm(prev => ({
      ...prev,
      activityType: value,
    }));
    setErrors(prev => ({ ...prev, activityType: undefined }));
  }, []);

  const handleSelectFrequency = useCallback(value => {
    setForm(prev => ({
      ...prev,
      frequency: value,
    }));
    setErrors(prev => ({ ...prev, date: undefined }));
  }, []);

  const handleSelectDate = useCallback(
    date => {
      if (!date) {
        setForm(prev => ({ ...prev, date: null, groupDay: '' }));
        return;
      }
      const dayName = WEEK_DAYS[date.getDay()] || '';
      setForm(prev => ({
        ...prev,
        date,
        groupDay: dayName,
      }));
      setErrors(prev => ({ ...prev, date: undefined }));
    },
    [],
  );

  const handleSelectLocationMode = useCallback(mode => {
    setForm(prev => ({
      ...prev,
      locationMode: mode,
    }));
    setErrors(prev => ({
      ...prev,
      onlineLink: undefined,
      streetAddress: undefined,
      city: undefined,
      state: undefined,
    }));
  }, []);

  const handleSelectState = useCallback(value => {
    setForm(prev => ({
      ...prev,
      address: { ...prev.address, state: value },
    }));
    setErrors(prev => ({ ...prev, state: undefined }));
  }, []);

  const handleChangeTitle = useCallback(text => {
    setForm(prev => ({ ...prev, title: text }));
    setErrors(prev => ({ ...prev, title: undefined }));
  }, []);

  const handleChangeDescription = useCallback(text => {
    setForm(prev => ({ ...prev, description: text }));
  }, []);

  const handleChangeOnlineLink = useCallback(text => {
    setForm(prev => ({ ...prev, onlineLink: text }));
    setErrors(prev => ({ ...prev, onlineLink: undefined }));
  }, []);

  const handleChangeAddressField = useCallback((field, value) => {
    setForm(prev => ({
      ...prev,
      address: { ...prev.address, [field]: value },
    }));
    if (field === 'streetAddress' || field === 'city' || field === 'state') {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, []);

  const handleSelectTime = useCallback(time => {
    if (!time) return;
    setForm(prev => ({ ...prev, time }));
    setErrors(prev => ({ ...prev, time: undefined }));
  }, []);

  // Validation stub
  const validateStep = () => {
    const e = {};
    if (step === 1) {
      if (!form.title) e.title = 'Required';
      if (!form.activityType) e.activityType = 'Please select an activity type';
      if (!form.date) e.date = 'Select a date';
      if (!form.time) e.time = 'Select a time';
    }
    if (step === 2) {
      const needsOnline = form.locationMode === 'online' || form.locationMode === 'both';
      const needsAddress = form.locationMode === 'inPerson' || form.locationMode === 'both';
      if (needsOnline) {
        if (!form.onlineLink) e.onlineLink = 'Online link required for online sessions';
        else if (!form.onlineLink.startsWith('http')) e.onlineLink = 'Must start with http:// or https://';
      }
      if (needsAddress) {
        if (!form.address.streetAddress) e.streetAddress = 'Street address required';
        if (!form.address.city) e.city = 'City required';
        if (!form.address.state) e.state = 'State required';
      }
    }
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

  const handleNavBack = useCallback(() => {
    if (step > 1) {
      setStep(prev => Math.max(prev - 1, 1));
      return true;
    }
    navigation.goBack();
    return true;
  }, [navigation, step]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          onPress={handleNavBack}
          style={{ paddingHorizontal: 8, paddingVertical: 4 }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={24} color={themeVariables.blackColor} />
        </TouchableOpacity>
      ),
      headerBackVisible: false,
    });
  }, [navigation, handleNavBack]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', handleNavBack);
    return () => sub.remove();
  }, [handleNavBack]);

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
    const sessionDateValue = combineDateTime(form.date, form.time);
    const groupTimeValue = formatTimeValue(form.time);
    const facilitatorLimitValue = 2;
    const participantLimitValue = 6;
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
      facilitators: [],
      participants: [],
      community: communityId,
      createdBy: userId,
      facilitatorLimit: facilitatorLimitValue,
      participantLimit: participantLimitValue,
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
      <ScrollView contentContainerStyle={scrollContentStyle}>
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
              <TitleSection
                value={form.title}
                onChange={handleChangeTitle}
                error={errors.title}
                baseInputProps={baseInputProps}
                styles={styles}
              />
              <ActivityTypeSection
                value={form.activityType}
                options={ACTIVITY_TYPES}
                onSelect={handleSelectActivityType}
                error={errors.activityType}
                styledInputProps={styledInputProps}
                styles={styles}
              />
              <DescriptionSection
                value={form.description}
                onChange={handleChangeDescription}
                baseInputProps={baseInputProps}
                styles={styles}
              />
              <FrequencySection
                value={form.frequency}
                options={FREQUENCY_OPTIONS}
                onSelect={handleSelectFrequency}
                styledInputProps={styledInputProps}
                styles={styles}
              />
              <DateSection
                value={form.date}
                onChange={handleSelectDate}
                error={errors.date}
                helperText="Choose the first or only date; we’ll track the weekday automatically."
                styledInputProps={styledInputProps}
                styles={styles}
              />
              <TimeSection
                value={form.time}
                onChange={handleSelectTime}
                error={errors.time}
                helperText="Set the start time for the session."
                styledInputProps={styledInputProps}
                styles={styles}
              />
            </>
          )}

          {step === 2 && (
            <LocationSection
              form={form}
              errors={errors}
              baseInputProps={baseInputProps}
              styledInputProps={styledInputProps}
              onChangeLocationMode={handleSelectLocationMode}
              onChangeOnlineLink={handleChangeOnlineLink}
              onChangeAddressField={handleChangeAddressField}
              onSelectState={handleSelectState}
              stateOptions={AU_STATES}
              styles={styles}
            />
          )}

          {step === 3 && (
            <CoverImageSection
              form={form}
              onPickImage={pickImage}
              styles={styles}
            />
          )}
        </View>

        <View style={styles.buttons}>
          <View style={styles.buttonSpacer} />
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
    color: themeVariables.blackColor,
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
    backgroundColor: 'transparent',
    padding: 0,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
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
    backgroundColor: '#f9f9f9',
    marginBottom: 12,
  },
  inputContent: {
    backgroundColor: '#f9f9f9',
  },
  inputOutline: {
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  locationModeRow: {
    flexDirection: 'row',
    marginTop: 12,
    marginBottom: 8,
  },
  locationModeButton: {
    flex: 1,
    paddingVertical: 10,
    marginRight: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  locationModeButtonActive: {
    backgroundColor: themeVariables.primaryColor,
    borderColor: themeVariables.primaryColor,
  },
  locationModeText: {
    color: themeVariables.blackColor,
    fontWeight: '600',
  },
  locationModeTextActive: {
    color: themeVariables.whiteColor,
  },
  addressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  halfInput: {
    flex: 1,
    marginRight: 8,
  },
  lastInRow: {
    marginRight: 0,
  },
  rowInput: {
    flex: 1,
    marginRight: 8,
    marginTop: 0,
  },
  addressInput: {
    marginBottom: 8,
  },
  addressDropdown: {
    flex: 1,
    marginRight: 8,
    marginTop: 0,
  },
  locationSubLabel: {
    marginTop: 12,
    marginBottom: 6,
  },
  inputLabelText: {
    color: themeVariables.blackColor,
    fontSize: 12,
  },
  tooltipText: {
    color: themeVariables.whiteColor,
    fontSize: 13,
  },
  activityTypeWrapper: {
    marginTop: 4,
  },
  multilineInput: {
    minHeight: 120,
  },
  coverLabel: {
    marginTop: 28,
  },
  timeSelect: {
    marginTop: 8,
  },
  labelWithTooltip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  tooltipIconTarget: {
    marginLeft: 6,
  },
  tooltipContainer: {
    padding: 0,
  },
  tooltipBubble: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
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
  scheduleLabel: {
    marginTop: 16,
  },
  addressSectionLabel: {
    marginTop: 12,
    marginBottom: 6,
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
    borderRadius: 14,
    overflow: 'hidden',
  },
  imageEditBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: themeVariables.primaryColor,
    padding: 6,
    borderRadius: 20,
  },
  imageRect: {
    width: 240,
    height: 150,
    borderRadius: 14,
    resizeMode: 'cover',
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

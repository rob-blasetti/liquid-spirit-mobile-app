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
import StudyCircleBookSection from './sections/StudyCircleBookSection';
import DescriptionSection from './sections/DescriptionSection';
import FrequencySection from './sections/FrequencySection';
import DateSection from './sections/DateSection';
import TimeSection from './sections/TimeSection';
import LocationSection from './sections/LocationSection';
import CoverImageSection from './sections/CoverImageSection';
import AttendeesSection from '../CreateSession/sections/AttendeesSection';
import ChildrensCurriculumSection from './sections/ChildrensCurriculumSection';

import { UserContext } from '../../contexts/UserContext';
import { createActivity } from '../../services/ActivityService';
import { getMemberList } from '../../services/UserService';
import { STUDY_CIRCLE_BOOKS } from './constants';

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
const formatMembersForPayload = (list = []) =>
  list
    .map(member => {
      const id =
        member?._id ||
        member?.id ||
        member?.userId ||
        member?.refId?._id ||
        member?.refId?.id;
      if (!id) return null;
      return { _id: String(id), type: 'Member' };
    })
    .filter(Boolean);

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
        outline: 'transparent',
      },
    }),
    [],
  );
  const baseInputProps = useMemo(
    () => ({
      mode: 'flat',
      theme: inputTheme,
      outlineColor: 'transparent',
      activeOutlineColor: 'transparent',
      underlineColor: 'transparent',
      activeUnderlineColor: 'transparent',
      contentStyle: styles.inputContent,
      style: styles.inputOutline,
    }),
    [inputTheme],
  );
  const styledInputProps = useMemo(
    () => ({
      ...baseInputProps,
      style: [styles.inputOutline, styles.input],
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
    venueId: '',
    address: {
      streetAddress: '',
      suburb: '',
      city: '',
      state: '',
      postalCode: '',
    },
    imageUrl: '',
    activityType: '',
    studyCircleBook: '',
    facilitators: [],
    participants: [],
    facilitatorSearch: '',
    participantSearch: '',
    curriculumGrade: '',
    curriculumLessonValue: '',
    curriculumSetCode: '',
    curriculumSetId: '',
    curriculumSetTitle: '',
    curriculumLessonId: '',
    curriculumLessonTitle: '',
    curriculumLessonNumber: null,
  });
  const [errors, setErrors] = useState({});
  const [allMembers, setAllMembers] = useState([]);
  const [memberOptions, setMemberOptions] = useState([]);
  const [memberLoading, setMemberLoading] = useState(false);
  const [memberError, setMemberError] = useState('');
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

  useEffect(() => {
    if (!communityId || !token) return;
    let cancelled = false;
    const loadMembers = async () => {
      setMemberLoading(true);
      setMemberError('');
      try {
        const members = await getMemberList(communityId);
        if (!cancelled) {
          const list = Array.isArray(members) ? members : [];
          setAllMembers(list);
          setMemberOptions(list);
        }
      } catch (err) {
        if (!cancelled) {
          setMemberError(err?.message || 'Unable to load members.');
          setAllMembers([]);
          setMemberOptions([]);
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
  }, [communityId, token]);

  useEffect(() => {
    const searchValue = (form.facilitatorSearch || form.participantSearch || '').trim().toLowerCase();
    if (!searchValue) {
      setMemberOptions(allMembers);
      return;
    }
    const filtered = allMembers.filter(member => {
      const fullName = `${member.firstName || ''} ${member.lastName || ''}`.toLowerCase();
      const email = (member.email || '').toLowerCase();
      return fullName.includes(searchValue) || email.includes(searchValue);
    });
    setMemberOptions(filtered);
  }, [allMembers, form.facilitatorSearch, form.participantSearch]);

  useEffect(() => {
    if (form.activityType !== "Children's Class" && (form.curriculumGrade || form.curriculumLessonValue)) {
      setForm(prev => ({
        ...prev,
        curriculumGrade: '',
      curriculumLessonValue: '',
      curriculumSetCode: '',
      curriculumSetId: '',
      curriculumSetTitle: '',
      curriculumLessonId: '',
      curriculumLessonTitle: '',
      curriculumLessonNumber: null,
      }));
      setErrors(prev => ({ ...prev, curriculumGrade: undefined, curriculumLesson: undefined }));
    }
  }, [form.activityType, form.curriculumGrade, form.curriculumLessonValue]);

  const handleSelectActivityType = useCallback(value => {
    setForm(prev => ({
      ...prev,
      activityType: value,
      studyCircleBook: value === 'Study Circle' ? prev.studyCircleBook : '',
      curriculumGrade: value === "Children's Class" ? prev.curriculumGrade : '',
      curriculumLessonValue: value === "Children's Class" ? prev.curriculumLessonValue : '',
      curriculumSetCode: value === "Children's Class" ? prev.curriculumSetCode : '',
      curriculumSetId: value === "Children's Class" ? prev.curriculumSetId : '',
      curriculumSetTitle: value === "Children's Class" ? prev.curriculumSetTitle : '',
      curriculumLessonId: value === "Children's Class" ? prev.curriculumLessonId : '',
      curriculumLessonTitle: value === "Children's Class" ? prev.curriculumLessonTitle : '',
      curriculumLessonNumber: value === "Children's Class" ? prev.curriculumLessonNumber : null,
    }));
    setErrors(prev => ({
      ...prev,
      activityType: undefined,
      studyCircleBook: undefined,
      curriculumGrade: undefined,
      curriculumLesson: undefined,
    }));
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

  const handleSelectCurriculumGrade = useCallback((grade) => {
    setForm(prev => ({
      ...prev,
      curriculumGrade: grade,
      curriculumLessonValue: '',
      curriculumSetCode: '',
      curriculumSetId: '',
      curriculumSetTitle: '',
      curriculumLessonId: '',
      curriculumLessonTitle: '',
      curriculumLessonNumber: null,
    }));
    setErrors(prev => ({ ...prev, curriculumGrade: undefined, curriculumLesson: undefined }));
  }, []);

  const handleSelectCurriculumLesson = useCallback((value) => {
    setForm(prev => ({ ...prev, curriculumLessonValue: value }));
    setErrors(prev => ({ ...prev, curriculumLesson: undefined }));
  }, []);

  const handleCurriculumSetMeta = useCallback((setMeta) => {
    setForm(prev => ({
      ...prev,
      curriculumSetCode: setMeta?.code || '',
      curriculumSetId: setMeta?.id || '',
      curriculumSetTitle: setMeta?.title || '',
    }));
  }, []);

  const handleCurriculumLessonMeta = useCallback((lessonMeta) => {
    setForm(prev => ({
      ...prev,
      curriculumLessonId: lessonMeta?.id || '',
      curriculumLessonTitle: lessonMeta?.title || '',
      curriculumLessonNumber:
        lessonMeta?.number != null
          ? lessonMeta.number
          : prev.curriculumLessonNumber,
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

  const handleSelectStudyCircleBook = useCallback(value => {
    setForm(prev => ({ ...prev, studyCircleBook: value }));
    setErrors(prev => ({ ...prev, studyCircleBook: undefined }));
  }, []);

  const handleChangeFacilitatorSearch = useCallback(text => {
    setForm(prev => ({ ...prev, facilitatorSearch: text }));
  }, []);

  const handleChangeParticipantSearch = useCallback(text => {
    setForm(prev => ({ ...prev, participantSearch: text }));
  }, []);

  const handleAddMember = useCallback((member, field, searchField) => {
    if (!member) return;
    const memberId = member._id || member.id || member.userId || member.refId?._id || member.refId?.id;
    setForm(prev => {
      const existingIds = (prev[field] || []).map(entry => entry._id || entry.id || entry.userId || entry.refId?._id || entry.refId?.id);
      if (!memberId || existingIds.includes(memberId)) {
        return { ...prev, [searchField]: '' };
      }
      return {
        ...prev,
        [field]: [...(prev[field] || []), member],
        [searchField]: '',
      };
    });
  }, []);

  const handleRemoveMember = useCallback((memberId, field) => {
    if (!memberId) return;
    setForm(prev => ({
      ...prev,
      [field]: (prev[field] || []).filter(entry => {
        const id = entry._id || entry.id || entry.userId || entry.refId?._id || entry.refId?.id;
        return String(id) !== String(memberId);
      }),
    }));
  }, []);

  const handleAddFacilitator = useCallback(member => handleAddMember(member, 'facilitators', 'facilitatorSearch'), [handleAddMember]);
  const handleAddParticipant = useCallback(member => handleAddMember(member, 'participants', 'participantSearch'), [handleAddMember]);
  const handleRemoveFacilitator = useCallback(memberId => handleRemoveMember(memberId, 'facilitators'), [handleRemoveMember]);
  const handleRemoveParticipant = useCallback(memberId => handleRemoveMember(memberId, 'participants'), [handleRemoveMember]);

  const handleSelectVenue = useCallback((venueId) => {
    setForm(prev => ({ ...prev, venueId: String(venueId) }));
    setErrors(prev => ({ ...prev, venueId: undefined }));
  }, []);

  // Validation stub
  const validateStep = () => {
    const e = {};
    if (step === 1) {
      if (!form.title) e.title = 'Required';
      if (!form.activityType) e.activityType = 'Please select an activity type';
      if (form.activityType === 'Study Circle' && !form.studyCircleBook) {
        e.studyCircleBook = 'Please select a book';
      }
      if (form.activityType === "Children's Class") {
        const gradeNorm = String(form.curriculumGrade || '').trim().toLowerCase();
        if (!form.curriculumGrade) e.curriculumGrade = 'Select a grade.';
        if (gradeNorm !== 'preschool' && !form.curriculumLessonValue) {
          e.curriculumLesson = 'Select a curriculum lesson.';
        }
      }
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
        if (!form.venueId) e.venueId = 'Select a venue for in-person sessions';
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
      title: form.title || 'Create Activity',
    });
  }, [form.title, navigation, handleNavBack]);

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
    const trimmedOnlineLink = (form.onlineLink || '').trim();
    const includeOnlineLink = form.locationMode === 'online' || form.locationMode === 'both';
    const venues = form.venueId ? [form.venueId] : [];
    const facilitatorLimitValue = 2;
    const participantLimitValue = 6;
    const payload = {
      title: form.title,
      description: form.description,
      sessionDate: sessionDateValue ? sessionDateValue.toISOString() : null,
      ...(form.curriculumGrade ? { grade: form.curriculumGrade } : {}),
      groupDetails: {
        day: form.groupDay || null,
        frequency: form.frequency,
        time: groupTimeValue || null,
      },
      ...(includeOnlineLink && trimmedOnlineLink ? { onlineLink: trimmedOnlineLink } : {}),
      venues,
      imageUrl: form.imageUrl,
      activityType: form.activityType,
      studyCircleBook: form.activityType === 'Study Circle' ? form.studyCircleBook : undefined,
      facilitators: formatMembersForPayload(form.facilitators),
      participants: formatMembersForPayload(form.participants),
      community: communityId,
      createdBy: userId,
      facilitatorLimit: facilitatorLimitValue,
      participantLimit: participantLimitValue,
    };
    if (form.activityType === "Children's Class" && form.curriculumGrade && form.curriculumLessonValue) {
      const lessonStr = String(form.curriculumLessonValue || '').trim();
      payload.curriculumLesson = lessonStr;
    }
    if (!venues.length) {
      delete payload.venues;
    }
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
              {form.activityType === "Children's Class" ? (
                <ChildrensCurriculumSection
                  activityType={form.activityType}
                  grade={form.curriculumGrade}
                  value={form.curriculumLessonValue}
                  onChangeGrade={handleSelectCurriculumGrade}
                  onChangeLessonValue={handleSelectCurriculumLesson}
                  onChangeSetMeta={handleCurriculumSetMeta}
                  onChangeLessonMeta={handleCurriculumLessonMeta}
                  gradeError={errors.curriculumGrade}
                  lessonError={errors.curriculumLesson}
                  styles={styles}
                />
              ) : null}
              {form.activityType === 'Study Circle' ? (
                <StudyCircleBookSection
                  value={form.studyCircleBook}
                  options={STUDY_CIRCLE_BOOKS}
                  onSelect={handleSelectStudyCircleBook}
                  error={errors.studyCircleBook}
                  styledInputProps={styledInputProps}
                  styles={styles}
                />
              ) : null}
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
              onSelectVenue={handleSelectVenue}
              venuePlaceholder="Where will it be?"
              venueSelectProps={{
                communityId,
                token,
                value: form.venueId,
              }}
              styles={styles}
            />
          )}

          {step === 3 && (
            <>
              <AttendeesSection
                facilitators={form.facilitators}
                participants={form.participants}
                facilitatorSearch={form.facilitatorSearch}
                participantSearch={form.participantSearch}
                onChangeFacilitatorSearch={handleChangeFacilitatorSearch}
                onChangeParticipantSearch={handleChangeParticipantSearch}
                onAddFacilitator={handleAddFacilitator}
                onAddParticipant={handleAddParticipant}
                onRemoveFacilitator={handleRemoveFacilitator}
                onRemoveParticipant={handleRemoveParticipant}
                memberOptions={memberOptions}
                memberLoading={memberLoading}
                memberError={memberError}
                styles={styles}
              />
              <CoverImageSection
                form={form}
                onPickImage={pickImage}
                styles={styles}
              />
            </>
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
    marginRight: themeVariables.spacing.m,
  },
  input: {
    backgroundColor: '#f9f9f9',
    marginBottom: themeVariables.spacing.m,
  },
  inputContent: {
    backgroundColor: '#f9f9f9',
  },
  inputOutline: {
    borderRadius: 6,
    borderWidth: 0,
    borderColor: 'transparent',
  },
  locationModeRow: {
    flexDirection: 'row',
    marginTop: themeVariables.spacing.m,
    marginBottom: themeVariables.spacing.s,
  },
  locationModeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
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
    marginBottom: themeVariables.spacing.xs,
  },
  halfInput: {
    flex: 1,
    marginRight: 0,
  },
  lastInRow: {
    marginRight: 0,
  },
  rowInput: {
    flex: 1,
    marginRight: 0,
    marginTop: 0,
  },
  addressInput: {
    marginBottom: themeVariables.spacing.s,
  },
  addressDropdown: {
    flex: 1,
    marginRight: 0,
    marginTop: 0,
  },
  locationSubLabel: {
    marginTop: themeVariables.spacing.m,
    marginBottom: themeVariables.spacing.xs,
  },
  inputLabelText: {
    color: themeVariables.blackColor,
    fontSize: 16,
    fontWeight: '600',
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
    marginTop: 0,
  },
  labelWithTooltip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4,
    paddingLeft: 4,
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
    fontSize: 16,
    fontWeight: '600',
    paddingLeft: 4,
    marginBottom: 6,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    marginBottom: 6,
    color: themeVariables.blackColor,
  },
  scheduleLabel: {
    marginTop: 8,
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

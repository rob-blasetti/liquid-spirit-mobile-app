import React, { useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, BackHandler, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { HelperText, Title } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from 'liquid-spirit-styleguide/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import themeVariables from '../../styles/theme';
import { UserContext } from '../../contexts/UserContext';
import { createSession } from '../../services/ActivityService';
import { getMemberList } from '../../services/UserService';
import { fetchChildrensCurriculum } from '../../services/CurriculumService';
import ScheduleSection from './sections/ScheduleSection';
import LocationSection from '../CreateActivity/sections/LocationSection';
import AttendeesSection from './sections/AttendeesSection';
import CurriculumSection from './sections/CurriculumSection';

const formatDateOnly = (value) => {
  if (!(value instanceof Date)) return '';
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const cleanObject = (obj = {}) => {
  const next = {};
  Object.entries(obj).forEach(([key, value]) => {
    if (value == null) return;
    if (typeof value === 'string' && value.trim() === '') return;
    next[key] = typeof value === 'string' ? value.trim() : value;
  });
  return next;
};

const TOTAL_STEPS = 2;
const AU_STATES = ['VIC', 'QLD', 'NSW', 'ACT', 'NT', 'TAS', 'WA', 'SA'];
const CHILDREN_GRADES = ['1', '2', '3', '4', '5', '6'];

const initialForm = {
  notes: '',
  date: null,
  locationMode: 'online',
  onlineLink: 'https://',
  venueName: '',
  address: {
    streetAddress: '',
    suburb: '',
    city: '',
    state: '',
    postalCode: '',
  },
  facilitators: [],
  participants: [],
  facilitatorSearch: '',
  participantSearch: '',
  curriculumLesson: {
    grade: '',
    setId: '',
    setTitle: '',
    lessonId: '',
    lessonTitle: '',
    lessonNumber: null,
  },
};

const CreateSession = ({ navigation, route }) => {
  const { bottom: bottomInset } = useSafeAreaInsets();
  const { token } = useContext(UserContext);
  const params = route?.params || {};
  const communityId = params.communityId || params.activity?.community || params.activityPreload?.community;
  const resolvedActivityId = useMemo(() => {
    const candidates = [
      params.activityId,
      params.activity?.id,
      params.activity?._id,
      params.activityPreload?.id,
      params.activityPreload?._id,
    ];
    const match = candidates.find((candidate) => candidate);
    return match ? String(match) : '';
  }, [params]);
  const activityTitle =
    params.activityTitle ||
    params.activity?.title ||
    params.activityPreload?.title ||
    '';
  const activityType =
    params.activityType ||
    params.activity?.activityType ||
    params.activityPreload?.activityType ||
    '';

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

  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [memberOptions, setMemberOptions] = useState([]);
  const [memberLoading, setMemberLoading] = useState(false);
  const [memberError, setMemberError] = useState('');
  const [allMembers, setAllMembers] = useState([]);
  const [curriculumSets, setCurriculumSets] = useState([]);
  const [curriculumLessons, setCurriculumLessons] = useState([]);
  const [curriculumLoading, setCurriculumLoading] = useState(false);
  const [curriculumError, setCurriculumError] = useState('');
  const progressAnim = useRef(new Animated.Value(1 / TOTAL_STEPS)).current;

  useEffect(() => {
    const grade = form.curriculumLesson.grade;
    if (!grade || activityType !== "Children's Class") {
      setCurriculumSets([]);
      setCurriculumLessons([]);
      setCurriculumError('');
      setCurriculumLoading(false);
      return;
    }
    let cancelled = false;
    const loadCurriculum = async () => {
      setCurriculumLoading(true);
      setCurriculumError('');
      try {
        const data = await fetchChildrensCurriculum(grade);
        const setsData = Array.isArray(data)
          ? data
          : Array.isArray(data?.sets)
            ? data.sets
            : [];
        if (!cancelled) {
          setCurriculumSets(setsData);
          setCurriculumLessons([]);
          const selectedSet = setsData.find(
            (s) => (s.id || s._id || s.title) === form.curriculumLesson.setId,
          );
          if (selectedSet) {
            setCurriculumLessons(selectedSet.lessons || []);
          } else {
            setForm((prev) => ({
              ...prev,
              curriculumLesson: {
                ...prev.curriculumLesson,
                setId: '',
                setTitle: '',
                lessonId: '',
                lessonTitle: '',
                lessonNumber: null,
              },
            }));
          }
        }
      } catch (err) {
        if (!cancelled) {
          setCurriculumError(err?.message || 'Unable to load curriculum.');
          setCurriculumSets([]);
          setCurriculumLessons([]);
        }
      } finally {
        if (!cancelled) setCurriculumLoading(false);
      }
    };
    loadCurriculum();
    return () => {
      cancelled = true;
    };
  }, [activityType, form.curriculumLesson.grade, form.curriculumLesson.setId]);

  const handleChange = useCallback((field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }, []);

  const handleAddressChange = useCallback((field, value) => {
    setForm((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value,
      },
    }));
    if (field === 'streetAddress' || field === 'city' || field === 'state') {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }, []);

  const handleSelectState = useCallback((value) => {
    setForm((prev) => ({
      ...prev,
      address: { ...prev.address, state: value },
    }));
    setErrors((prev) => ({ ...prev, state: undefined }));
  }, []);

  const handleSelectLocationMode = useCallback((mode) => {
    setForm((prev) => ({
      ...prev,
      locationMode: mode,
    }));
    setErrors((prev) => ({
      ...prev,
      onlineLink: undefined,
      streetAddress: undefined,
      city: undefined,
      state: undefined,
    }));
  }, []);

  const handleAddMember = useCallback((field, member) => {
    const memberId = member?._id || member?.id;
    if (!memberId) return;
    setForm((prev) => {
      const existing = prev[field] || [];
      if (existing.some((m) => (m._id || m.id) === memberId)) return prev;
      return { ...prev, [field]: [...existing, member], [`${field.slice(0, -1)}Search`]: '' };
    });
  }, []);

  const handleRemoveMember = useCallback((field, memberId) => {
    setForm((prev) => ({
      ...prev,
      [field]: (prev[field] || []).filter((m) => (m._id || m.id) !== memberId),
    }));
  }, []);

  const handleChangeMemberSearch = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSelectCurriculumSet = useCallback(
    (setId) => {
      const selectedSet = curriculumSets.find((s) => (s.id || s._id || s.title) === setId);
      const lessons = selectedSet?.lessons || [];
      setCurriculumLessons(lessons);
      setErrors((prev) => ({ ...prev, curriculumSet: undefined, curriculumLesson: undefined }));
      setForm((prev) => ({
        ...prev,
        curriculumLesson: {
          ...prev.curriculumLesson,
          setId,
          setTitle: selectedSet?.title || selectedSet?.name || '',
          lessonId: '',
          lessonTitle: '',
          lessonNumber: null,
        },
      }));
    },
    [curriculumSets],
  );

  const handleSelectCurriculumLesson = useCallback(
    (lessonId) => {
      const selectedLesson = curriculumLessons.find((l) => (l.id || l._id || l.lessonId) === lessonId);
      setErrors((prev) => ({ ...prev, curriculumLesson: undefined }));
      setForm((prev) => ({
        ...prev,
        curriculumLesson: {
          ...prev.curriculumLesson,
          lessonId,
          lessonTitle: selectedLesson?.title || selectedLesson?.name || '',
          lessonNumber:
            selectedLesson?.lessonNumber ??
            selectedLesson?.number ??
            (typeof selectedLesson?.id === 'number' ? selectedLesson.id : null),
        },
      }));
    },
    [curriculumLessons],
  );

  const handleSelectCurriculumGrade = useCallback((grade) => {
    setErrors((prev) => ({ ...prev, curriculumGrade: undefined, curriculumSet: undefined, curriculumLesson: undefined }));
    setForm((prev) => ({
      ...prev,
      curriculumLesson: {
        grade,
        setId: '',
        setTitle: '',
        lessonId: '',
        lessonTitle: '',
        lessonNumber: null,
      },
    }));
  }, []);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: step / TOTAL_STEPS,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [step, progressAnim]);

  const validate = useCallback(({ includeLocation = true, includeCurriculum = true } = {}) => {
    const validationErrors = {};
    if (!resolvedActivityId) {
      validationErrors.activity = 'Missing activity details.';
    }
    if (!(form.date instanceof Date)) {
      validationErrors.date = 'Select a session date.';
    }
    if (includeCurriculum && activityType === "Children's Class") {
      if (!form.curriculumLesson.grade) validationErrors.curriculumGrade = 'Select a grade.';
      if (!form.curriculumLesson.setId) validationErrors.curriculumSet = 'Select a set.';
      if (!form.curriculumLesson.lessonId) validationErrors.curriculumLesson = 'Select a lesson.';
    }
    if (includeLocation) {
      const needsOnline = form.locationMode === 'online' || form.locationMode === 'both';
      const needsAddress = form.locationMode === 'inPerson' || form.locationMode === 'both';
      if (needsOnline) {
        if (!form.onlineLink) validationErrors.onlineLink = 'Online link required for online sessions';
        else if (!form.onlineLink.startsWith('http')) validationErrors.onlineLink = 'Must start with http:// or https://';
      }
      if (needsAddress) {
        if (!form.address.streetAddress) validationErrors.streetAddress = 'Street address required';
        if (!form.address.city) validationErrors.city = 'City required';
        if (!form.address.state) validationErrors.state = 'State required';
      }
    }
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  }, [activityType, form.address.city, form.address.state, form.address.streetAddress, form.curriculumLesson.grade, form.curriculumLesson.lessonId, form.curriculumLesson.setId, form.date, form.locationMode, form.onlineLink, resolvedActivityId]);

  const validateStep = useCallback(() => {
    if (step === 1) {
      return validate({ includeLocation: true, includeCurriculum: false });
    }
    return validate({ includeLocation: false, includeCurriculum: true });
  }, [step, validate]);

  useEffect(() => {
    if (!communityId || !token) return;
    let cancelled = false;
    const loadMembers = async () => {
      setMemberLoading(true);
      setMemberError('');
      try {
        const members = await getMemberList(communityId);
        if (!cancelled) {
          setAllMembers(Array.isArray(members) ? members : []);
          setMemberOptions(Array.isArray(members) ? members : []);
        }
      } catch (err) {
        if (!cancelled) {
          setMemberError(err?.message || 'Unable to load members.');
          setAllMembers([]);
          setMemberOptions([]);
        }
      } finally {
        if (!cancelled) setMemberLoading(false);
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
    const filtered = allMembers.filter((member) => {
      const fullName = `${member.firstName || ''} ${member.lastName || ''}`.toLowerCase();
      const email = (member.email || '').toLowerCase();
      return fullName.includes(searchValue) || email.includes(searchValue);
    });
    setMemberOptions(filtered);
  }, [allMembers, form.facilitatorSearch, form.participantSearch]);

  const onNext = useCallback(() => {
    if (validateStep()) {
      setStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
    }
  }, [validateStep]);

  const onBackStep = useCallback(() => {
    setStep((prev) => Math.max(prev - 1, 1));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!token) {
      Alert.alert('Not signed in', 'Please log in to create a new session.');
      return;
    }
    if (!validate({ includeLocation: true, includeCurriculum: true })) return;
    try {
      setSubmitting(true);
      const payload = cleanObject({
        notes: form.notes,
        date: formatDateOnly(form.date),
        status: 'Scheduled',
        locationMode: form.locationMode,
        onlineLink: form.onlineLink,
        venueName: form.venueName,
        address: cleanObject(form.address),
        facilitators: (form.facilitators || []).map((m) => m._id || m.id).filter(Boolean),
        participants: (form.participants || []).map((m) => m._id || m.id).filter(Boolean),
        curriculumLesson:
          activityType === "Children's Class"
            ? cleanObject({
                grade: form.curriculumLesson.grade,
                set: form.curriculumLesson.setId,
                setTitle: form.curriculumLesson.setTitle,
                lessonId: form.curriculumLesson.lessonId,
                lessonTitle: form.curriculumLesson.lessonTitle,
                lessonNumber: form.curriculumLesson.lessonNumber,
              })
            : undefined,
      });
      if (payload.address && Object.keys(payload.address).length === 0) {
        delete payload.address;
      }
      await createSession(resolvedActivityId, payload, token);
      Alert.alert('Session Created', 'Your session has been scheduled.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Unable to create session', err?.message || 'Please try again later.');
    } finally {
      setSubmitting(false);
    }
  }, [form, navigation, resolvedActivityId, token, validate]);

  const handleNavBack = useCallback(() => {
    if (step > 1) {
      setStep((prev) => Math.max(prev - 1, 1));
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
      title: activityTitle || 'Create Session',
    });
  }, [activityTitle, navigation, handleNavBack]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', handleNavBack);
    return () => sub.remove();
  }, [handleNavBack]);

  const scrollContentStyle = useMemo(
    () => [styles.container, { paddingBottom: Math.max(bottomInset + 32, 120) }],
    [bottomInset],
  );

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={scrollContentStyle}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.progressHeader}>
          <Title style={styles.heading}>Create Session</Title>
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
        <HelperText type="error" visible={!!errors.activity}>
          {errors.activity}
        </HelperText>

        <View style={styles.formCard}>
          {step === 1 && (
            <>
              <ScheduleSection
                date={form.date}
                onChangeDate={(value) => handleChange('date', value)}
                errors={errors}
                styledInputProps={styledInputProps}
                styles={styles}
              />

              <LocationSection
                form={form}
                errors={errors}
                onChangeOnlineLink={(text) => handleChange('onlineLink', text)}
                onChangeVenueName={(text) => handleChange('venueName', text)}
                onChangeAddressField={handleAddressChange}
                onChangeLocationMode={handleSelectLocationMode}
                onSelectState={handleSelectState}
                stateOptions={AU_STATES}
                baseInputProps={baseInputProps}
                styledInputProps={styledInputProps}
                styles={styles}
              />
            </>
          )}

          {step === 2 && (
            <>
              <AttendeesSection
                facilitators={form.facilitators}
                participants={form.participants}
                facilitatorSearch={form.facilitatorSearch}
                participantSearch={form.participantSearch}
                onChangeFacilitatorSearch={(text) => handleChangeMemberSearch('facilitatorSearch', text)}
                onChangeParticipantSearch={(text) => handleChangeMemberSearch('participantSearch', text)}
                onAddFacilitator={(member) => handleAddMember('facilitators', member)}
                onAddParticipant={(member) => handleAddMember('participants', member)}
                onRemoveFacilitator={(memberId) => handleRemoveMember('facilitators', memberId)}
                onRemoveParticipant={(memberId) => handleRemoveMember('participants', memberId)}
                memberOptions={memberOptions}
                memberLoading={memberLoading}
                memberError={memberError}
                styles={styles}
              />

              {activityType === "Children's Class" && (
                <CurriculumSection
                  gradeOptions={CHILDREN_GRADES}
                  setOptions={curriculumSets.map((s) => ({
                    label: s.title || s.name || `Set ${s.id || s._id || ''}`,
                    value: s.id || s._id || s.title || '',
                  }))}
                  lessonOptions={curriculumLessons.map((l) => ({
                    label:
                      l.title ||
                      l.name ||
                      (l.lessonNumber != null ? `Lesson ${l.lessonNumber}` : String(l.id || l._id || '')),
                    value: l.id || l._id || l.lessonId || l.title || '',
                  }))}
                  selectedGrade={form.curriculumLesson.grade}
                  selectedSet={form.curriculumLesson.setId}
                  selectedLesson={form.curriculumLesson.lessonId}
                  onSelectGrade={handleSelectCurriculumGrade}
                  onSelectSet={handleSelectCurriculumSet}
                  onSelectLesson={handleSelectCurriculumLesson}
                  loading={curriculumLoading}
                  gradeError={errors.curriculumGrade}
                  setError={errors.curriculumSet}
                  lessonError={errors.curriculumLesson}
                  fetchError={curriculumError}
                  styles={styles}
                />
              )}
            </>
          )}
        </View>

        <View style={styles.buttons}>
          {step > 1 ? (
            <View style={styles.buttonSpacer} />
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
              label={submitting ? 'Submitting...' : 'Submit'}
              onPress={handleSubmit}
              disabled={submitting}
              style={[styles.actionButton, styles.primaryActionButton, submitting && styles.buttonDisabled]}
            />
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: themeVariables.screenBackgroundColor || '#fff',
  },
  container: {
    padding: 16,
    paddingBottom: 40,
    backgroundColor: themeVariables.screenBackgroundColor || '#fff',
  },
  heading: {
    marginBottom: 0,
    color: themeVariables.blackColor,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
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
  section: {
    marginTop: 16,
  },
  sectionLabel: {
    marginTop: 20,
    color: themeVariables.blackColor,
  },
  locationSubLabel: {
    marginTop: 12,
    marginBottom: 6,
  },
  addressSectionLabel: {
    marginTop: 12,
    marginBottom: 6,
  },
  sectionTitle: {
    marginBottom: 8,
    color: themeVariables.blackColor,
    fontSize: 16,
  },
  subheading: {
    marginTop: 12,
    marginBottom: 8,
    color: themeVariables.blackColor,
  },
  input: {
    backgroundColor: '#f9f9f9',
    marginBottom: 8,
  },
  multilineInput: {
    minHeight: 100,
  },
  inputContent: {
    backgroundColor: '#f9f9f9',
  },
  inputOutline: {
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
  halfInput: {
    flex: 1,
    marginRight: 8,
  },
  lastInRow: {
    marginRight: 0,
  },
  addressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
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
  buttonDisabled: {
    opacity: 0.8,
  },
});

export default CreateSession;

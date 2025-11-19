import React, { useContext, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { HelperText, TextInput, Title } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from 'liquid-spirit-styleguide/native';

import themeVariables from '../styles/theme';
import { UserContext } from '../contexts/UserContext';
import { createSession } from '../services/ActivityService';

const formatDateLabel = (value) => {
  if (!(value instanceof Date)) return 'Select Date';
  return value.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatTimeLabel = (value) => {
  if (!(value instanceof Date)) return 'Select Time';
  return value.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
};

const formatDateOnly = (value) => {
  if (!(value instanceof Date)) return '';
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatTimeValue = (value) => {
  if (!(value instanceof Date)) return '';
  const hours = String(value.getHours()).padStart(2, '0');
  const minutes = String(value.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const combineDateTime = (date, time) => {
  if (!(date instanceof Date)) return null;
  if (!(time instanceof Date)) return new Date(date);
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    time.getHours(),
    time.getMinutes(),
    0,
    0,
  );
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

const initialForm = {
  title: '',
  description: '',
  notes: '',
  date: null,
  time: null,
  onlineLink: '',
  venueName: '',
  address: {
    streetAddress: '',
    suburb: '',
    city: '',
    state: '',
    postalCode: '',
  },
};

const CreateSession = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { token } = useContext(UserContext);
  const params = route?.params || {};
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

  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddressChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value,
      },
    }));
  };

  const validate = () => {
    const validationErrors = {};
    if (!resolvedActivityId) {
      validationErrors.activity = 'Missing activity details.';
    }
    if (!form.title.trim()) {
      validationErrors.title = 'Session title is required.';
    }
    if (!(form.date instanceof Date)) {
      validationErrors.date = 'Select a session date.';
    }
    if (!(form.time instanceof Date)) {
      validationErrors.time = 'Select a session start time.';
    }
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!token) {
      Alert.alert('Not signed in', 'Please log in to create a new session.');
      return;
    }
    if (!validate()) return;
    try {
      setSubmitting(true);
      const scheduledAt = combineDateTime(form.date, form.time);
      const payload = cleanObject({
        title: form.title,
        description: form.description,
        notes: form.notes,
        scheduledAt: scheduledAt ? scheduledAt.toISOString() : undefined,
        date: formatDateOnly(form.date),
        time: formatTimeValue(form.time),
        status: 'Scheduled',
        onlineLink: form.onlineLink,
        venueName: form.venueName,
        address: cleanObject(form.address),
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
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingBottom: insets.bottom + 32 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Title style={styles.heading}>
          Create Session{activityTitle ? ` for ${activityTitle}` : ''}
        </Title>
        <HelperText type="error" visible={!!errors.activity}>
          {errors.activity}
        </HelperText>

        <TextInput
          label="Session Title *"
          mode="outlined"
          value={form.title}
          onChangeText={(text) => handleChange('title', text)}
          error={!!errors.title}
          style={styles.input}
        />
        <HelperText type="error" visible={!!errors.title}>
          {errors.title}
        </HelperText>

        <TextInput
          label="Description"
          mode="outlined"
          multiline
          numberOfLines={4}
          value={form.description}
          onChangeText={(text) => handleChange('description', text)}
          style={styles.input}
        />

        <View style={styles.row}>
          <Button
            secondary
            size="medium"
            label={formatDateLabel(form.date)}
            onPress={() => setShowDatePicker(true)}
            style={[styles.flexGrow, styles.selector]}
          />
        </View>
        <HelperText type="error" visible={!!errors.date}>
          {errors.date}
        </HelperText>
        {showDatePicker && (
          <DateTimePicker
            value={form.date || new Date()}
            mode="date"
            display="default"
            onChange={(_, value) => {
              setShowDatePicker(false);
              if (value) {
                handleChange('date', value);
              }
            }}
          />
        )}

        <View style={styles.row}>
          <Button
            secondary
            size="medium"
            label={formatTimeLabel(form.time)}
            onPress={() => setShowTimePicker(true)}
            style={[styles.flexGrow, styles.selector]}
          />
        </View>
        <HelperText type="error" visible={!!errors.time}>
          {errors.time}
        </HelperText>
        {showTimePicker && (
          <DateTimePicker
            value={form.time || new Date()}
            mode="time"
            display="default"
            onChange={(_, value) => {
              setShowTimePicker(false);
              if (value) {
                handleChange('time', value);
              }
            }}
          />
        )}

        <TextInput
          label="Online Link"
          mode="outlined"
          value={form.onlineLink}
          onChangeText={(text) => handleChange('onlineLink', text)}
          style={styles.input}
        />

        <TextInput
          label="Venue Name"
          mode="outlined"
          value={form.venueName}
          onChangeText={(text) => handleChange('venueName', text)}
          style={styles.input}
        />

        <Title style={styles.sectionHeading}>Location</Title>
        <TextInput
          label="Street Address"
          mode="outlined"
          value={form.address.streetAddress}
          onChangeText={(text) => handleAddressChange('streetAddress', text)}
          style={styles.input}
        />
        <TextInput
          label="Suburb"
          mode="outlined"
          value={form.address.suburb}
          onChangeText={(text) => handleAddressChange('suburb', text)}
          style={styles.input}
        />
        <TextInput
          label="City"
          mode="outlined"
          value={form.address.city}
          onChangeText={(text) => handleAddressChange('city', text)}
          style={styles.input}
        />
        <TextInput
          label="State"
          mode="outlined"
          value={form.address.state}
          onChangeText={(text) => handleAddressChange('state', text)}
          style={styles.input}
        />
        <TextInput
          label="Postal Code"
          mode="outlined"
          value={form.address.postalCode}
          onChangeText={(text) => handleAddressChange('postalCode', text)}
          style={styles.input}
          keyboardType="number-pad"
        />

        <Title style={styles.sectionHeading}>Notes</Title>
        <TextInput
          label="Additional Notes"
          mode="outlined"
          multiline
          numberOfLines={3}
          value={form.notes}
          onChangeText={(text) => handleChange('notes', text)}
          style={styles.input}
        />

        <Button
          primary
          size="large"
          label={submitting ? 'Creating...' : 'Create Session'}
          onPress={handleSubmit}
          disabled={submitting}
          style={[styles.submitButton, submitting && styles.buttonDisabled]}
        />
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
    padding: 20,
    flexGrow: 1,
  },
  heading: {
    marginBottom: 8,
  },
  sectionHeading: {
    marginTop: 18,
    marginBottom: 6,
    fontSize: 16,
  },
  input: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selector: {
    justifyContent: 'flex-start',
  },
  flexGrow: {
    flex: 1,
  },
  submitButton: {
    marginTop: 12,
  },
  buttonDisabled: {
    opacity: 0.8,
  },
});

export default CreateSession;

import React, { useState, useContext } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { Button, TextInput, Title, HelperText, RadioButton, Snackbar, Avatar, IconButton } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { launchImageLibrary } from 'react-native-image-picker';

import { UserContext } from '../contexts/UserContext';
import { createActivity } from '../services/ActivityService';

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
    frequency: 'One-time',
    facilitators: [],
    participants: [],
    onlineLink: '',
    address: { street: '', city: '', state: '', postalCode: '' },
    imageUri: '',
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });

  // Validation stub
  const validateStep = () => {
    const e = {};
    if (step === 1 && !form.title) e.title = 'Required';
    if (step === 2 && !form.date) e.date = 'Select a date';
    if (step === 3 && form.onlineLink && !form.onlineLink.startsWith('http')) e.onlineLink = 'Must start with http:// or https://';
    // ...other step-specific checks
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onNext = () => {
    if (validateStep()) {
      setStep((s) => Math.min(s + 1, 5));
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
        setForm({ ...form, imageUri: asset.uri });
      }
    });
  };

  const onSubmit = async () => {
    // Assemble payload
    const payload = {
      title: form.title,
      description: form.description,
      date: form.date ? form.date.toISOString() : null,
      time: form.time ? form.time.toISOString() : null,
      frequency: form.frequency,
      onlineLink: form.onlineLink,
      address: form.address,
      imageUri: form.imageUri,
      communityId,
      userId,
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
        <Title style={styles.title}>Step {step} of 5</Title>

        {step === 1 && (
          <>
            <TextInput
              label="Title *"
              value={form.title}
              onChangeText={(text) => setForm({ ...form, title: text })}
              error={!!errors.title}
            />
            <HelperText type="error" visible={!!errors.title}>
              {errors.title}
            </HelperText>

            <TextInput
              label="Description"
              value={form.description}
              multiline
              numberOfLines={3}
              onChangeText={(text) => setForm({ ...form, description: text })}
            />
          </>
        )}

        {step === 2 && (
          <>
            <Button onPress={() => setShowDatePicker(true)} mode="outlined">
              {form.date ? form.date.toDateString() : 'Select Date'}
            </Button>
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

            <Button onPress={() => setShowTimePicker(true)} mode="outlined" style={{ marginTop: 12 }}>
              {form.time ? form.time.toLocaleTimeString() : 'Select Time'}
            </Button>
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

            <Title style={{ marginTop: 20 }}>Frequency</Title>
            <RadioButton.Group
              onValueChange={(value) => setForm({ ...form, frequency: value })}
              value={form.frequency}
            >
              {['One-time', 'Daily', 'Weekly', 'Monthly'].map((opt) => (
                <RadioButton.Item key={opt} label={opt} value={opt} />
              ))}
            </RadioButton.Group>
          </>
        )}

        {step === 3 && (
          <>
            <TextInput
              label="Online Link"
              value={form.onlineLink}
              onChangeText={(text) => setForm({ ...form, onlineLink: text })}
              error={!!errors.onlineLink}
            />
            <HelperText type="error" visible={!!errors.onlineLink}>
              {errors.onlineLink}
            </HelperText>
            <Title style={{ marginTop: 20 }}>Or pick a location below</Title>
            <TextInput
              label="Street Address"
              value={form.address.street}
              onChangeText={(t) => setForm({ ...form, address: { ...form.address, street: t } })}
            />
            <TextInput
              label="City"
              value={form.address.city}
              onChangeText={(t) => setForm({ ...form, address: { ...form.address, city: t } })}
            />
          </>
        )}

        {step === 4 && (
          <>
            <Title>Facilitators & Participants</Title>
            {/* These could be custom multi-select chips; stubbed out here */}
            <HelperText>— implement a MultiSelect / ChipInput for community members —</HelperText>
          </>
        )}

        {step === 5 && (
          <>
            <Title>Cover Image</Title>
            {form.imageUri ? (
              <Avatar.Image size={120} source={{ uri: form.imageUri }} />
            ) : (
              <IconButton icon="camera-plus" size={60} onPress={pickImage} />
            )}
          </>
        )}

        <View style={styles.buttons}>
          {step > 1 && <Button onPress={onBack}>Back</Button>}
          {step < 5 ? (
            <Button mode="contained" onPress={onNext}>
              Next
            </Button>
          ) : (
            <Button mode="contained" onPress={onSubmit}>
              Create
            </Button>
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
  container: { padding: 16 },
  title: { marginBottom: 24 },
  buttons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24 },
});

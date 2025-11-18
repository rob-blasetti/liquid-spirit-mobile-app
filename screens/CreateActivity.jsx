import React, { useEffect, useRef, useState, useContext } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform, StyleSheet, Animated, Text, TouchableOpacity } from 'react-native';
import { TextInput, Title, HelperText, RadioButton, Snackbar, Avatar } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { launchImageLibrary } from 'react-native-image-picker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Button } from 'liquid-spirit-styleguide/native';
import themeVariables from '../styles/theme';

import { UserContext } from '../contexts/UserContext';
import { createActivity } from '../services/ActivityService';

const TOTAL_STEPS = 5;

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
  const progressAnim = useRef(new Animated.Value(1 / TOTAL_STEPS)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: step / TOTAL_STEPS,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [step, progressAnim]);

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

              <Title style={styles.sectionLabel}>Frequency</Title>
              <RadioButton.Group
                onValueChange={(value) => setForm({ ...form, frequency: value })}
                value={form.frequency}
              >
                {['One-time', 'Daily', 'Weekly', 'Monthly'].map((opt) => (
                  <RadioButton.Item key={opt} label={opt} value={opt} color={themeVariables.primaryColor} />
                ))}
              </RadioButton.Group>
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
                value={form.address.street}
                onChangeText={(t) => setForm({ ...form, address: { ...form.address, street: t } })}
              />
              <TextInput
                label="City"
                mode="outlined"
                value={form.address.city}
                onChangeText={(t) => setForm({ ...form, address: { ...form.address, city: t } })}
              />
            </>
          )}

          {step === 4 && (
            <>
              <Title>Facilitators & Participants</Title>
              <HelperText>— implement a MultiSelect / ChipInput for community members —</HelperText>
            </>
          )}

          {step === 5 && (
            <>
              <Title>Cover Image</Title>
              <TouchableOpacity
                style={form.imageUri ? styles.imagePreview : styles.imagePicker}
                onPress={pickImage}
                activeOpacity={0.8}
              >
                {form.imageUri ? (
                  <>
                    <View style={styles.imagePreviewWrapper}>
                      <Avatar.Image size={140} source={{ uri: form.imageUri }} />
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
});

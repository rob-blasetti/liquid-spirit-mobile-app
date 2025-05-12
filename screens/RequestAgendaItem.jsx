import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { TextInput, Button, Title, HelperText } from 'react-native-paper';
import { Linking } from 'react-native';

/**
 * Screen to request an agenda item via email.
 * User enters a title and description, then taps Send to open the mail client.
 */
export default function RequestAgendaItem({ navigation }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!title.trim()) e.title = 'Title is required';
    if (!description.trim()) e.description = 'Description is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSend = () => {
    if (!validate()) return;
    const to = 'info@liquidspirit.org';
    const subject = encodeURIComponent('Request: Assembly Meeting Agenda Item');
    const body = encodeURIComponent(
      `Title: ${title}\n\nDescription:\n${description}`
    );
    const url = `mailto:${to}?subject=${subject}&body=${body}`;
    Linking.openURL(url)
      .then(() => {
        // Optionally navigate back
        navigation.goBack();
      })
      .catch(() => {
        Alert.alert('Error', 'Unable to open email client');
      });
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Title style={styles.title}>Request Agenda Item</Title>
        <TextInput
          label="Title"
          value={title}
          onChangeText={setTitle}
          error={!!errors.title}
          mode="outlined"
          style={styles.input}
        />
        <HelperText type="error" visible={!!errors.title}>
          {errors.title}
        </HelperText>
        <TextInput
          label="Description"
          value={description}
          onChangeText={setDescription}
          error={!!errors.description}
          mode="outlined"
          multiline
          numberOfLines={4}
          style={[styles.input, styles.textArea]}
        />
        <HelperText type="error" visible={!!errors.description}>
          {errors.description}
        </HelperText>
        <Button mode="contained" onPress={handleSend} style={styles.button}>
          Send
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    padding: 20,
  },
  title: {
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    marginBottom: 12,
  },
  textArea: {
    minHeight: 100,
  },
  button: {
    marginTop: 10,
    backgroundColor: '#312783',
  },
});
import React, { useState, useContext } from 'react';
import {
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  View,
  ActivityIndicator,
} from 'react-native';
import { TextInput, Button, Title, HelperText } from 'react-native-paper';
import { sendAgendaItemSuggestion } from '../services/AssemblyService';
import { UserContext } from '../contexts/UserContext';

export default function RequestAgendaItem({ navigation, route }) {
  const { communityId, token } = useContext(UserContext);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!title.trim()) e.title = 'Title is required';
    if (!description.trim()) e.description = 'Description is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSend = async () => {
    if (!validate()) return;
    try {
      setLoading(true);
      await sendAgendaItemSuggestion(token, communityId, title, description);
      Alert.alert('Success', 'Agenda item suggestion sent');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to send suggestion');
    } finally {
      setLoading(false);
    }
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
        <Button mode="contained" onPress={handleSend} loading={loading} disabled={loading} style={styles.button}>
          Send
        </Button>
      </ScrollView>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#312783" />
        </View>
      )}
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
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
});
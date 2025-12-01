import React, { useState, useContext, useMemo } from 'react';
import {
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  View,
  ActivityIndicator,
} from 'react-native';
import { createAgendaItem } from '../services/AgendaItemService';
import { UserContext } from '../contexts/UserContext';
import { CommunityContext } from '../contexts/CommunityContext';
import themeVariables from '../styles/theme';
import { Button } from 'liquid-spirit-styleguide/native';
import TitleSection from './CreateActivity/sections/TitleSection';
import DescriptionSection from './CreateActivity/sections/DescriptionSection';

export default function RequestAgendaItem({ navigation, route }) {
  const { token } = useContext(UserContext);
  const { communityId } = useContext(CommunityContext);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const baseInputProps = useMemo(
    () => ({
      mode: 'outlined',
      outlineColor: themeVariables.borderLightColor || '#ddd',
      activeOutlineColor: themeVariables.primaryColor,
      style: styles.input,
    }),
    [],
  );

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
      console.log('[RequestAgendaItem] Sending', {
        communityId,
        hasToken: Boolean(token),
        title,
        descriptionLength: description?.length || 0,
      });
      await createAgendaItem({
        token,
        communityId,
        title,
        description,
      });
      console.log('[RequestAgendaItem] Sent successfully');
      Alert.alert('Success', 'Agenda item suggestion sent');
      navigation.goBack();
    } catch (error) {
      console.log('[RequestAgendaItem] Send failed', error);
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
        <TitleSection
          value={title}
          onChange={setTitle}
          error={errors.title}
          helperText="Summarise the agenda item you want to add."
          label=""
          placeholder="e.g. Budget discussion"
          baseInputProps={baseInputProps}
          styles={styles}
        />
        <DescriptionSection
          value={description}
          onChange={setDescription}
          error={errors.description}
          helperText="Describe what should be discussed or decided."
          label=""
          placeholder="e.g. Outline points you’d like covered"
          baseInputProps={baseInputProps}
          styles={styles}
        />
        <Button
          primary
          size="medium"
          label={loading ? 'Sending...' : 'Send'}
          onPress={handleSend}
          disabled={loading}
          style={styles.button}
        />
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
    padding: themeVariables.spacing.xl,
    flexGrow: 1,
    backgroundColor: themeVariables.screenBackgroundColor,
  },
  title: {
    marginBottom: themeVariables.spacing.l,
    textAlign: 'center',
  },
  input: {
    marginBottom: themeVariables.spacing.m,
    backgroundColor: themeVariables.formInputBg,
  },
  multilineInput: {
    minHeight: 120,
  },
  button: {
    marginTop: themeVariables.spacing.m,
    alignSelf: 'stretch',
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

import React, { useMemo } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import themeVariables from '../../styles/theme';

const ContentSection = ({
  title = 'Content',
  placeholder = "What's on your mind?",
  value,
  onChangeText,
  error,
  required = false,
  multiline = true,
  minHeight = 100,
  testID = 'contentSectionInput',
}) => {
  const labelText = useMemo(() => (required ? `${title} *` : title), [required, title]);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{labelText}</Text>
      <TextInput
        testID={testID}
        style={[styles.textArea, { minHeight }]}
        placeholder={placeholder}
        placeholderTextColor="#999"
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        textAlignVertical="top"
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

export default ContentSection;

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    marginBottom: 20,
  },
  label: {
    alignSelf: 'flex-start',
    color: themeVariables.blackColor,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  textArea: {
    width: '100%',
    backgroundColor: themeVariables.whiteColor,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    fontSize: 16,
    color: '#333',
    minHeight: 100,
  },
  errorText: {
    marginTop: 6,
    color: themeVariables.redColor || '#d00',
    fontSize: 13,
  },
});

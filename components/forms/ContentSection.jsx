import React, { useMemo, useState } from 'react';
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
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{labelText}</Text>
      <TextInput
        testID={testID}
        style={[
          styles.textArea,
          { minHeight },
          isFocused && styles.textAreaFocused,
          error && styles.textAreaError,
        ]}
        placeholder={placeholder}
        placeholderTextColor="#667085"
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        textAlignVertical="top"
        selectionColor={themeVariables.primaryColor}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        accessibilityLabel={labelText}
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
    backgroundColor: themeVariables.formInputBg || themeVariables.whiteColor,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: themeVariables.formInputBorder || '#CBD5E1',
    padding: 16,
    fontSize: 16,
    color: themeVariables.blackColor,
    minHeight: 100,
  },
  textAreaFocused: {
    borderColor: themeVariables.primaryColor,
    shadowColor: themeVariables.primaryColor,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  textAreaError: {
    borderColor: themeVariables.formErrorBorder || themeVariables.redColor || '#d00',
  },
  errorText: {
    marginTop: 6,
    color: themeVariables.redColor || '#d00',
    fontSize: 13,
  },
});

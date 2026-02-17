import React from 'react';
import { Text } from 'react-native';
import FormTextInput from '../../../components/forms/inputs/FormTextInput';

const TitleSection = ({
  value,
  onChange,
  error,
  helperText = 'Give your activity a short, clear name.',
  placeholder = '',
  label = '',
  baseInputProps,
  styles,
}) => (
  <>
    <Text style={styles.sectionLabel}>Title *</Text>
    <FormTextInput
      inputProps={baseInputProps}
      label={label}
      placeholder={placeholder || 'e.g. Grade 2 class'}
      value={value}
      onChangeText={onChange}
      error={!!error}
      errorText={error}
      helperText={helperText}
      testID="create-activity-title"
      accessibilityLabel="create-activity-title"
      style={styles.input}
    />
  </>
);

export default TitleSection;

import React from 'react';
import { Text } from 'react-native';
import FormTextInput from '../../../components/forms/inputs/FormTextInput';

const DescriptionSection = ({
  value,
  onChange,
  error,
  helperText = 'Share a few sentences about the activity (optional).',
  placeholder = '',
  label = 'Description',
  baseInputProps,
  styles,
}) => (
  <>
    <Text style={styles.sectionLabel}>Description</Text>
    <FormTextInput
      inputProps={baseInputProps}
      label={label}
      placeholder={placeholder || 'e.g. Outline points you’d like covered'}
      value={value}
      multiline
      numberOfLines={4}
      onChangeText={onChange}
      error={!!error}
      errorText={error}
      helperText={helperText}
      style={[styles.input, styles.multilineInput]}
      textAlignVertical="top"
    />
  </>
);

export default DescriptionSection;

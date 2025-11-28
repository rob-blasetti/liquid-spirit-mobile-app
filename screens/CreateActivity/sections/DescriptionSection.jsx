import React from 'react';
import { Title } from 'react-native-paper';
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
    <Title style={styles.sectionLabel}>Description</Title>
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

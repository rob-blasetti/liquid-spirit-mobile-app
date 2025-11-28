import React from 'react';
import { Title } from 'react-native-paper';
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
    <Title style={styles.sectionLabel}>Title</Title>
    <FormTextInput
      inputProps={baseInputProps}
      label={label}
      placeholder={placeholder || 'e.g. Grade 2 class'}
      value={value}
      onChangeText={onChange}
      error={!!error}
      errorText={error}
      helperText={helperText}
      style={styles.input}
    />
  </>
);

export default TitleSection;

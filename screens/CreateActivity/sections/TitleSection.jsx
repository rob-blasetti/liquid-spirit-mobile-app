import React from 'react';
import { HelperText, Title } from 'react-native-paper';
import FormTextInput from '../../../components/forms/inputs/FormTextInput';

const TitleSection = ({ value, onChange, error, baseInputProps, styles }) => (
  <>
    <Title style={styles.sectionLabel}>Title</Title>
    <FormTextInput
      inputProps={baseInputProps}
      label=""
      value={value}
      onChangeText={onChange}
      error={!!error}
      style={styles.input}
    />
    <HelperText type="info" visible>
      Give your activity a short, clear name.
    </HelperText>
    <HelperText type="error" visible={!!error}>
      {error}
    </HelperText>
  </>
);

export default TitleSection;

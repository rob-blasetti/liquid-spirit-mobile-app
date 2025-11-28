import React from 'react';
import { HelperText } from 'react-native-paper';
import FormTextInput from '../../../components/forms/inputs/FormTextInput';

const DescriptionSection = ({ value, onChange, baseInputProps, styles }) => (
  <>
    <FormTextInput
      inputProps={baseInputProps}
      label="Description"
      value={value}
      multiline
      numberOfLines={4}
      onChangeText={onChange}
      style={[styles.input, styles.multilineInput]}
      textAlignVertical="top"
    />
    <HelperText type="info" visible>
      Share a few sentences about the activity (optional).
    </HelperText>
  </>
);

export default DescriptionSection;

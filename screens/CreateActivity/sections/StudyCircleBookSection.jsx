import React from 'react';
import { Text } from 'react-native';

import DropdownInput from '../../../components/forms/inputs/DropdownInput';
import FormHelperText from '../../../components/forms/inputs/FormHelperText';

const StudyCircleBookSection = ({
  value,
  options,
  onSelect,
  error,
  styledInputProps,
  styles,
}) => (
  <>
    <Text style={styles.sectionLabel}>Study Circle Book *</Text>
    <DropdownInput
      label=""
      value={value}
      options={options}
      placeholder="Select a book"
      onSelect={onSelect}
      error={error}
      textInputProps={styledInputProps}
      style={styles.activityTypeWrapper}
    />
    <FormHelperText type="info" visible={!error}>
      Choose the Ruhi book this study circle will cover.
    </FormHelperText>
  </>
);

export default StudyCircleBookSection;

import React from 'react';
import { Text } from 'react-native';
import { HelperText } from 'react-native-paper';

import DropdownInput from '../../../components/forms/inputs/DropdownInput';

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
    <HelperText type="info" visible={!error}>
      Choose the Ruhi book this study circle will cover.
    </HelperText>
  </>
);

export default StudyCircleBookSection;

import React from 'react';
import { Text } from 'react-native';
import DropdownInput from '../../../components/forms/inputs/DropdownInput';
import FormHelperText from '../../../components/forms/inputs/FormHelperText';

const FrequencySection = ({
  value,
  options,
  onSelect,
  styledInputProps,
  styles,
}) => (
  <>
    <Text style={[styles.sectionLabel, styles.scheduleLabel]}>Session Frequency *</Text>
    <DropdownInput
      value={value}
      options={options}
      placeholder="Select frequency"
      onSelect={onSelect}
      textInputProps={styledInputProps}
    />
    <FormHelperText type="info" visible>
      Pick how often the group meets so we can schedule it correctly.
    </FormHelperText>
  </>
);

export default FrequencySection;

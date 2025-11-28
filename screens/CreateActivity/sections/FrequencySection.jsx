import React from 'react';
import { HelperText, Title } from 'react-native-paper';
import DropdownInput from '../../../components/forms/inputs/DropdownInput';

const FrequencySection = ({
  value,
  options,
  onSelect,
  styledInputProps,
  styles,
}) => (
  <>
    <Title style={[styles.sectionLabel, styles.scheduleLabel]}>Frequency</Title>
    <DropdownInput
      label="Meeting Frequency *"
      value={value}
      options={options}
      placeholder="Select frequency"
      onSelect={onSelect}
      textInputProps={styledInputProps}
    />
    <HelperText type="info" visible>
      Pick how often the group meets so we can schedule it correctly.
    </HelperText>
  </>
);

export default FrequencySection;

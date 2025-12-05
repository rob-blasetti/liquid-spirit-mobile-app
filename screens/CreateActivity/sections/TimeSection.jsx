import React from 'react';
import { Text } from 'react-native';
import TimeSelect from '../../../components/forms/inputs/TimeSelect';
import FormHelperText from '../../../components/forms/inputs/FormHelperText';

const TimeSection = ({
  value,
  onChange,
  error,
  helperText,
  styledInputProps,
  styles,
}) => (
  <>
    <Text style={[styles.sectionLabel, styles.scheduleLabel]}>Start Time *</Text>
    <TimeSelect
      value={value}
      onChange={onChange}
      inputProps={styledInputProps}
      style={styles.timeSelect}
    />
    <FormHelperText type="info" visible>
      {helperText}
    </FormHelperText>
    <FormHelperText type="error" visible={!!error}>
      {error}
    </FormHelperText>
  </>
);

export default TimeSection;

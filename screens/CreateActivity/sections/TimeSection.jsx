import React from 'react';
import { HelperText, Title } from 'react-native-paper';
import TimeSelect from '../../../components/forms/inputs/TimeSelect';

const TimeSection = ({
  value,
  onChange,
  error,
  helperText,
  styledInputProps,
  styles,
}) => (
  <>
    <Title style={[styles.sectionLabel, styles.scheduleLabel]}>Start Time</Title>
    <TimeSelect
      value={value}
      onChange={onChange}
      inputProps={styledInputProps}
      style={styles.timeSelect}
    />
    <HelperText type="error" visible={!!error}>
      {error}
    </HelperText>
    <HelperText type="info" visible>
      {helperText}
    </HelperText>
  </>
);

export default TimeSection;

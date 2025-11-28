import React from 'react';
import DatePickerInput from '../../../components/forms/inputs/DatePickerInput';

const DateSection = ({ value, onChange, error, helperText, styledInputProps, styles }) => (
  <DatePickerInput
    label="Initial Session Date"
    value={value || new Date()}
    onChange={onChange}
    error={error}
    helperText={helperText}
    inputProps={styledInputProps}
    style={styles.fullWidthButton}
  />
);

export default DateSection;

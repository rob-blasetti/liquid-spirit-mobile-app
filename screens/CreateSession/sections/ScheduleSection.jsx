import React from 'react';
import { View } from 'react-native';

import DatePickerInput from '../../../components/forms/inputs/DatePickerInput';

const ScheduleSection = ({
  date,
  onChangeDate,
  errors,
  styledInputProps,
  styles,
}) => (
  <View style={styles.section}>
    <DatePickerInput
      label="Session Date *"
      value={date}
      onChange={onChangeDate}
      helperText="Pick when this session will happen."
      error={errors.date}
      inputProps={styledInputProps}
    />
  </View>
);

export default ScheduleSection;

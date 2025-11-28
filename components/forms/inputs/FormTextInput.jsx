import React from 'react';
import { TextInput } from 'react-native-paper';

const FormTextInput = ({ inputProps, style, ...rest }) => (
  <TextInput
    {...inputProps}
    {...rest}
    style={[inputProps?.style, style]}
  />
);

export default FormTextInput;

import React from 'react';
import { TextInput, HelperText } from 'react-native-paper';
import { View } from 'react-native';

const FormTextInput = ({
  inputProps,
  style,
  helperText,
  helperType = 'info',
  errorText,
  ...rest
}) => {
  const hasError = Boolean(errorText);
  const helperContent = hasError ? errorText : helperText;
  const helperVariant = hasError ? 'error' : helperType;

  return (
    <View>
      <TextInput
        {...inputProps}
        {...rest}
        error={hasError}
        style={[inputProps?.style, style]}
      />
      {helperContent ? (
        <HelperText type={helperVariant} visible>
          {helperContent}
        </HelperText>
      ) : null}
    </View>
  );
};

export default FormTextInput;

import React, { useMemo } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import themeVariables from '../../../styles/theme';
import FormHelperText from './FormHelperText';

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
  const placeholderColor = inputProps?.placeholderTextColor || themeVariables.darkGreyColor || '#222';
  const mergedInputStyle = useMemo(
    () => [
      styles.input,
      inputProps?.style,
      style,
      hasError && styles.inputError,
    ].filter(Boolean),
    [hasError, inputProps?.style, style],
  );

  return (
    <View>
      <TextInput
        {...inputProps}
        {...rest}
        style={mergedInputStyle}
        placeholderTextColor={placeholderColor}
      />
      {helperContent ? (
        <FormHelperText type={hasError ? 'error' : helperType}>
          {helperContent}
        </FormHelperText>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  input: {
    width: '100%',
    alignSelf: 'stretch',
    backgroundColor: themeVariables.lightGreyColor || '#f3f3f3',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: themeVariables.borderLightColor || '#e0e0e0',
    color: themeVariables.blackColor,
  },
  inputError: {
    borderColor: '#d32f2f',
  },
});

export default FormTextInput;

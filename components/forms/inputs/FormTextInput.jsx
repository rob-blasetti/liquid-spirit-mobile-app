import React, { useMemo, useState } from 'react';
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
  const [isFocused, setIsFocused] = useState(false);
  const hasError = Boolean(errorText);
  const helperContent = hasError ? errorText : helperText;
  const placeholderColor = inputProps?.placeholderTextColor || '#667085';
  const mergedInputStyle = useMemo(
    () => [
      styles.input,
      inputProps?.style,
      style,
      isFocused && styles.inputFocused,
      hasError && styles.inputError,
    ].filter(Boolean),
    [hasError, inputProps?.style, isFocused, style],
  );

  return (
    <View>
      <TextInput
        {...inputProps}
        {...rest}
        style={mergedInputStyle}
        placeholderTextColor={placeholderColor}
        selectionColor={themeVariables.primaryColor}
        onFocus={event => {
          setIsFocused(true);
          inputProps?.onFocus?.(event);
          rest.onFocus?.(event);
        }}
        onBlur={event => {
          setIsFocused(false);
          inputProps?.onBlur?.(event);
          rest.onBlur?.(event);
        }}
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
    minHeight: 52,
    backgroundColor: themeVariables.formInputBg || '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: themeVariables.formInputBorder || '#CBD5E1',
    color: themeVariables.blackColor,
    fontSize: 16,
  },
  inputFocused: {
    borderColor: themeVariables.primaryColor,
    shadowColor: themeVariables.primaryColor,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  inputError: {
    borderColor: themeVariables.formErrorBorder || '#d32f2f',
  },
});

export default FormTextInput;

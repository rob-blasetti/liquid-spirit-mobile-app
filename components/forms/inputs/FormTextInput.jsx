import React from 'react';
import { TextInput, HelperText } from 'react-native-paper';
import { View } from 'react-native';
import themeVariables from '../../../styles/theme';

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
  const defaultBg = themeVariables.lightGreyColor || '#f3f3f3';
  const outlineColor = inputProps?.outlineColor ?? 'transparent';
  const activeOutlineColor = inputProps?.activeOutlineColor ?? 'transparent';
  const underlineColor = inputProps?.underlineColor ?? 'transparent';
  const mergedStyle = [
    inputProps?.style,
    style,
    { backgroundColor: defaultBg },
  ].filter(Boolean);
  const mergedContentStyle = [
    inputProps?.contentStyle,
    { backgroundColor: defaultBg },
  ].filter(Boolean);
  const mergedOutlineStyle = [
    inputProps?.outlineStyle,
    { borderRadius: 6, borderWidth: 0, borderColor: outlineColor },
  ].filter(Boolean);

  return (
    <View>
      <TextInput
        {...inputProps}
        {...rest}
        error={hasError}
        style={mergedStyle}
        contentStyle={mergedContentStyle}
        outlineStyle={mergedOutlineStyle}
        mode={inputProps?.mode || 'flat'}
        underlineColor={underlineColor}
        activeUnderlineColor={underlineColor}
        outlineColor={outlineColor}
        activeOutlineColor={activeOutlineColor}
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

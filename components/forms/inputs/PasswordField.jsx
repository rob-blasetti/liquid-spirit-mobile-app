import React, { useMemo, useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import themeVariables from '../../../styles/theme';

const PasswordField = ({
  value,
  onChangeText,
  placeholder = 'Enter password',
  style,
  inputStyle,
  iconColor = '#777',
  ...rest
}) => {
  const [visible, setVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const mergedWrapper = useMemo(
    () => [styles.wrapper, style].filter(Boolean),
    [style],
  );
  const mergedInput = useMemo(
    () => [styles.input, isFocused && styles.inputFocused, inputStyle].filter(Boolean),
    [inputStyle, isFocused],
  );

  return (
    <View style={mergedWrapper}>
      <TextInput
        style={mergedInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={!visible}
        autoCapitalize="none"
        autoCorrect={false}
        placeholderTextColor="#667085"
        selectionColor={themeVariables.primaryColor}
        onFocus={event => {
          setIsFocused(true);
          rest.onFocus?.(event);
        }}
        onBlur={event => {
          setIsFocused(false);
          rest.onBlur?.(event);
        }}
        {...rest}
      />
      <TouchableOpacity
        onPress={() => setVisible((prev) => !prev)}
        style={styles.icon}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityRole="button"
        accessibilityLabel={visible ? 'Hide password' : 'Show password'}
      >
        <Ionicons
          name={visible ? 'eye-off-outline' : 'eye-outline'}
          size={20}
          color={iconColor}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    alignSelf: 'stretch',
    position: 'relative',
  },
  input: {
    width: '100%',
    alignSelf: 'stretch',
    minHeight: 52,
    backgroundColor: themeVariables.formInputBg || '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: themeVariables.formInputBorder || '#CBD5E1',
    paddingRight: 44,
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
  icon: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 16,
    justifyContent: 'center',
  },
});

export default PasswordField;

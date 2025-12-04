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
  const mergedWrapper = useMemo(
    () => [styles.wrapper, style].filter(Boolean),
    [style],
  );
  const mergedInput = useMemo(
    () => [styles.input, inputStyle].filter(Boolean),
    [inputStyle],
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
        placeholderTextColor={themeVariables.darkGreyColor || '#444'}
        {...rest}
      />
      <TouchableOpacity
        onPress={() => setVisible((prev) => !prev)}
        style={styles.icon}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
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
    backgroundColor: themeVariables.lightGreyColor || '#f3f3f3',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 16,
    paddingRight: 44,
  },
  icon: {
    position: 'absolute',
    right: 12,
    top: -2,
    bottom: 14,
    justifyContent: 'center',
  },
});

export default PasswordField;

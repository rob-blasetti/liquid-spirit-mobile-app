import React, { useState, useMemo, useCallback } from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { TextInput, HelperText } from 'react-native-paper';
import Ionicons from 'react-native-vector-icons/Ionicons';

import themeVariables from '../../../styles/theme';

const normalizeOption = option => {
  if (option && typeof option === 'object') {
    return {
      label: option.label ?? option.name ?? option.value ?? '',
      value: option.value ?? option.id ?? option.label ?? '',
      meta: option.meta ?? option,
    };
  }
  const label = String(option ?? '');
  return { label, value: label, meta: option };
};

const DropdownInput = ({
  label,
  value,
  placeholder = 'Select an option',
  options = [],
  onSelect,
  error,
  disabled = false,
  style,
  textInputProps,
}) => {
  const [open, setOpen] = useState(false);

  const normalizedOptions = useMemo(() => options.map(normalizeOption), [options]);
  const selectedOption = useMemo(
    () => normalizedOptions.find(option => String(option.value) === String(value)),
    [normalizedOptions, value],
  );
  const displayValue = selectedOption?.label || value || '';
  const { style: inputStyle, ...restTextInputProps } = textInputProps || {};

  const toggleOpen = useCallback(() => {
    if (disabled) return;
    setOpen(prev => !prev);
  }, [disabled]);

  const handleSelect = useCallback(
    option => {
      setOpen(false);
      if (disabled) return;
      onSelect?.(option.value, option.meta ?? option);
    },
    [disabled, onSelect],
  );

  return (
    <View style={[styles.wrapper, style]}>
      <TouchableOpacity
        style={styles.touchWrapper}
        activeOpacity={0.9}
        onPress={toggleOpen}
        accessibilityRole="button"
        accessibilityLabel={typeof label === 'string' ? label : undefined}
      >
        <TextInput
          label={label}
          mode="outlined"
          value={displayValue || ''}
          placeholder={placeholder}
          editable={false}
          pointerEvents="none"
          style={[styles.input, inputStyle]}
          {...restTextInputProps}
          right={
            <TextInput.Icon
              icon={() => (
                <Ionicons
                  name={open ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={themeVariables.primaryColor}
                />
              )}
              onPress={toggleOpen}
            />
          }
        />
      </TouchableOpacity>
      {open && normalizedOptions.length > 0 && (
        <View style={styles.dropdownList}>
          {normalizedOptions.map(option => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.dropdownOption,
                displayValue === option.value && styles.dropdownOptionActive,
              ]}
              onPress={() => handleSelect(option)}
            >
              <Text style={styles.dropdownOptionText}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      {error ? (
        <HelperText type="error" visible>
          {error}
        </HelperText>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 12,
    position: 'relative',
  },
  touchWrapper: {
    position: 'relative',
  },
  input: {
    marginBottom: 0,
  },
  dropdownList: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '100%',
    borderWidth: 1,
    borderColor: themeVariables.borderLightColor || '#dcdcdc',
    borderRadius: 4,
    backgroundColor: themeVariables.whiteColor,
    overflow: 'hidden',
    zIndex: 10,
    elevation: 4,
  },
  dropdownOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: themeVariables.borderLightColor || '#ededed',
  },
  dropdownOptionActive: {
    backgroundColor: (themeVariables.primaryColor || '#007aff') + '15',
  },
  dropdownOptionText: {
    color: themeVariables.blackColor,
  },
});

export default DropdownInput;

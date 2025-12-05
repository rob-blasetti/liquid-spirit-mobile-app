import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Text, ScrollView } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import themeVariables from '../../../styles/theme';
import FormHelperText from './FormHelperText';

// Keep only one dropdown open at a time across the app
const dropdownListeners = new Set();
const notifyCloseOthers = (id) => {
  dropdownListeners.forEach((listener) => {
    try {
      listener(id);
    } catch (_) {}
  });
};

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
  multilineDisplay = false,
  closeSiblings = true,
  onDisabledPress,
}) => {
  const [open, setOpen] = useState(false);
  const selfId = useRef(`dropdown-${Date.now()}-${Math.random().toString(36).slice(2)}`);

  const normalizedOptions = useMemo(() => options.map(normalizeOption), [options]);
  const selectedOption = useMemo(
    () => normalizedOptions.find(option => String(option.value) === String(value)),
    [normalizedOptions, value],
  );
  const displayValue = selectedOption?.label || value || '';
  const { style: inputStyle, placeholderTextColor, ...restTextInputProps } = textInputProps || {};
  const mergedStyle = [
    styles.input,
    multilineDisplay && styles.inputMultiline,
    inputStyle,
    disabled && styles.inputDisabled,
  ].filter(Boolean);

  const toggleOpen = useCallback(() => {
    if (disabled) {
      onDisabledPress?.();
      return;
    }
    setOpen(prev => {
      const next = !prev;
      if (next && closeSiblings) {
        notifyCloseOthers(selfId.current);
      }
      return next;
    });
  }, [disabled, closeSiblings, onDisabledPress]);

  const handleSelect = useCallback(
    option => {
      setOpen(false);
      if (disabled) return;
      onSelect?.(option.value, option.meta ?? option);
    },
    [disabled, onSelect],
  );

  useEffect(() => {
    if (!closeSiblings) return;
    const handler = (id) => {
      if (id !== selfId.current) setOpen(false);
    };
    dropdownListeners.add(handler);
    return () => {
      dropdownListeners.delete(handler);
    };
  }, [closeSiblings]);

  return (
    <View style={[styles.wrapper, style]}>
      <TouchableOpacity
        style={[styles.touchWrapper, mergedStyle]}
        activeOpacity={0.9}
        onPress={toggleOpen}
        accessibilityRole="button"
        accessibilityLabel={typeof label === 'string' ? label : undefined}
        {...restTextInputProps}
      >
        <Text
          style={[
            styles.inputText,
            !displayValue && styles.placeholder,
            !displayValue && placeholderTextColor ? { color: placeholderTextColor } : null,
          ]}
          numberOfLines={multilineDisplay ? 2 : 1}
        >
          {displayValue || placeholder}
        </Text>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={themeVariables.blackColor || '#000'}
        />
      </TouchableOpacity>
      {open && normalizedOptions.length > 0 && (
        <View style={styles.dropdownList}>
          <ScrollView
            style={styles.dropdownScroll}
            contentContainerStyle={styles.dropdownContent}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
          >
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
          </ScrollView>
        </View>
      )}
      <FormHelperText type="error" visible={!!error}>
        {error}
      </FormHelperText>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  input: {
    marginBottom: 0,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: themeVariables.lightGreyColor || '#f3f3f3',
    borderWidth: 1,
    borderColor: themeVariables.borderLightColor || '#e0e0e0',
  },
  inputMultiline: {
    minHeight: 64,
    textAlignVertical: 'top',
  },
  inputDisabled: {
    opacity: 0.6,
  },
  inputText: {
    color: themeVariables.blackColor,
    flex: 1,
    marginRight: 8,
  },
  placeholder: {
    color: themeVariables.darkGreyColor || '#222',
  },
  dropdownList: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '100%',
    maxHeight: 280,
    borderWidth: 1,
    borderColor: themeVariables.borderLightColor || '#dcdcdc',
    borderRadius: 4,
    backgroundColor: themeVariables.whiteColor,
    overflow: 'hidden',
    zIndex: 10,
    elevation: 4,
  },
  dropdownScroll: {
    maxHeight: 280,
  },
  dropdownContent: {
    paddingBottom: 4,
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

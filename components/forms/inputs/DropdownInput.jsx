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
      title: option.title ?? option.name ?? option.label ?? option.value ?? '',
      subtitle: option.subtitle ?? '',
      value: option.value ?? option.id ?? option.label ?? '',
      meta: option.meta ?? option,
    };
  }
  const label = String(option ?? '');
  return { label, title: label, subtitle: '', value: label, meta: option };
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
    open && styles.inputOpen,
    error && styles.inputError,
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
    <View style={[styles.wrapper, open && styles.wrapperOpen, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TouchableOpacity
        style={[styles.touchWrapper, mergedStyle]}
        activeOpacity={0.9}
        onPress={toggleOpen}
        accessibilityRole="button"
        accessibilityLabel={typeof label === 'string' ? label : placeholder}
        accessibilityHint={open ? 'Closes the list of options' : 'Opens the list of options'}
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
        <View style={[styles.dropdownList, label && styles.dropdownListWithLabel]}>
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
                {option.subtitle ? (
                  <View>
                    <Text style={styles.dropdownOptionTitle}>{option.title}</Text>
                    <Text style={styles.dropdownOptionSubtitle}>{option.subtitle}</Text>
                  </View>
                ) : (
                  <Text style={styles.dropdownOptionText}>{option.label}</Text>
                )}
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
  wrapperOpen: {
    zIndex: 1000,
    elevation: 20,
  },
  label: {
    marginBottom: 6,
    color: themeVariables.blackColor,
    fontSize: 16,
    fontWeight: '600',
    paddingLeft: 4,
  },
  touchWrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
  },
  input: {
    marginBottom: 0,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: themeVariables.formInputBg || '#ffffff',
    borderWidth: 1,
    borderColor: themeVariables.formInputBorder || '#CBD5E1',
  },
  inputMultiline: {
    minHeight: 64,
    textAlignVertical: 'top',
  },
  inputOpen: {
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
  inputDisabled: {
    opacity: 0.7,
    backgroundColor: '#F8FAFC',
  },
  inputText: {
    color: themeVariables.blackColor,
    flex: 1,
    marginRight: 8,
    fontSize: 16,
  },
  placeholder: {
    color: '#667085',
  },
  dropdownList: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '100%',
    maxHeight: 280,
    borderWidth: 1,
    borderColor: themeVariables.formInputBorder || '#CBD5E1',
    borderRadius: 12,
    backgroundColor: themeVariables.whiteColor,
    overflow: 'hidden',
    zIndex: 1000,
    elevation: 20,
    shadowColor: '#0F172A',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  dropdownListWithLabel: {
    top: 58,
  },
  dropdownScroll: {
    maxHeight: 280,
  },
  dropdownContent: {
    paddingBottom: 4,
  },
  dropdownOption: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: themeVariables.borderLightColor || '#ededed',
  },
  dropdownOptionActive: {
    backgroundColor: (themeVariables.primaryColor || '#007aff') + '12',
  },
  dropdownOptionText: {
    color: themeVariables.blackColor,
    fontSize: 15,
  },
  dropdownOptionTitle: {
    color: themeVariables.blackColor,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  dropdownOptionSubtitle: {
    color: '#667085',
    fontSize: 13,
    lineHeight: 18,
  },
});

export default DropdownInput;

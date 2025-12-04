import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Text, ScrollView } from 'react-native';
import { TextInput, HelperText } from 'react-native-paper';
import Ionicons from 'react-native-vector-icons/Ionicons';

import themeVariables from '../../../styles/theme';

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
  const { style: inputStyle, ...restTextInputProps } = textInputProps || {};
  const defaultBg = themeVariables.lightGreyColor || '#f3f3f3';
  const defaultBorder = themeVariables.borderColor || '#d1d1d6';
  const outlineColor = restTextInputProps?.outlineColor || 'transparent';
  const activeOutlineColor = restTextInputProps?.activeOutlineColor || 'transparent';
  const underlineColor = restTextInputProps?.underlineColor || 'transparent';
  const mergedStyle = [
    styles.input,
    multilineDisplay && styles.inputMultiline,
    inputStyle,
    { backgroundColor: defaultBg },
  ].filter(Boolean);
  const mergedContentStyle = [restTextInputProps?.contentStyle, { backgroundColor: defaultBg }].filter(Boolean);
  const mergedOutlineStyle = [restTextInputProps?.outlineStyle, { borderRadius: 6, borderWidth: 0, borderColor: defaultBorder }].filter(Boolean);

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
        style={styles.touchWrapper}
        activeOpacity={0.9}
        onPress={toggleOpen}
        accessibilityRole="button"
        accessibilityLabel={typeof label === 'string' ? label : undefined}
      >
        <TextInput
          label={label}
          mode="flat"
          value={displayValue || ''}
          placeholder={placeholder}
          editable={false}
          pointerEvents="none"
          multiline={multilineDisplay}
          numberOfLines={multilineDisplay ? 2 : 1}
          style={mergedStyle}
          contentStyle={mergedContentStyle}
          outlineStyle={mergedOutlineStyle}
          outlineColor={outlineColor}
          activeOutlineColor={activeOutlineColor}
          underlineColor={underlineColor}
          activeUnderlineColor={underlineColor}
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
  inputMultiline: {
    minHeight: 64,
    textAlignVertical: 'top',
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

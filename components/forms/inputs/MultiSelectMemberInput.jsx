import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, TextInput as RNTextInput, ScrollView } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import themeVariables from '../../../styles/theme';
import FormHelperText from './FormHelperText';

const MultiSelectMemberInput = ({
  label,
  selected = [],
  onRemove,
  searchValue,
  onChangeSearch,
  placeholder = 'Search',
  options = [],
  // Use this when your dropdown options are filtered but you still want chip labels
  // to resolve from the full member list.
  labelOptions,
  onSelectOption,
  loading,
  error,
  emptyText = 'No matching members.',
  style,
  textInputProps,
}) => {
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const { style: inputStyle, ...restTextInputProps } = textInputProps || {};

  const optionLabelById = useMemo(() => {
    const map = new Map();
    const list = Array.isArray(labelOptions) ? labelOptions : options;
    (list || []).forEach((opt) => {
      if (!opt) return;
      const id = String(opt._id || opt.id || '');
      if (!id) return;
      const label =
        opt.fullName ||
        `${opt.firstName || ''} ${opt.lastName || ''}`.trim() ||
        opt.email ||
        opt.name ||
        'Member';
      map.set(id, label);
    });
    return map;
  }, [labelOptions, options]);

  if (__DEV__) {
    const unresolved = selected.filter((member) => {
      const details =
        member && typeof member === 'object'
          ? (member.details && typeof member.details === 'object'
              ? member.details
              : member.refId && typeof member.refId === 'object'
                ? member.refId
                : member.user && typeof member.user === 'object'
                  ? member.user
                  : member.profile && typeof member.profile === 'object'
                    ? member.profile
                    : member)
          : null;
      const rawId =
        (details && (details._id || details.id)) ||
        (member && typeof member === 'object' && (member._id || member.id)) ||
        (typeof member === 'string' ? member : null);
      const key = rawId ? String(rawId) : '';
      const firstName = details?.firstName || details?.first_name || member?.firstName;
      const lastName = details?.lastName || details?.last_name || member?.lastName;
      const email = details?.email || member?.email;
      const displayNameRaw =
        details?.fullName ||
        details?.displayName ||
        details?.name ||
        member?.fullName ||
        member?.displayName ||
        member?.name ||
        [firstName, lastName].filter(Boolean).join(' ').trim() ||
        email ||
        optionLabelById.get(key) ||
        'Member';
      return displayNameRaw === 'Member';
    });
    if (unresolved.length) {
      console.log('[MultiSelectMemberInput] unresolved selected entries', { label, unresolved });
    }
  }

  return (
    <View style={[styles.wrapper, style]}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <View
        style={[
          styles.selectionInput,
          inputStyle,
          isFocused && styles.selectionInputFocused,
          error && styles.selectionInputError,
        ]}
      >
        {selected.map((member, index) => {
          // Selected members can come through in a few shapes (string ids, {details}, {refId}, etc.).
          const details =
            member && typeof member === 'object'
              ? (member.details && typeof member.details === 'object'
                  ? member.details
                  : member.refId && typeof member.refId === 'object'
                    ? member.refId
                    : member.user && typeof member.user === 'object'
                      ? member.user
                      : member.profile && typeof member.profile === 'object'
                        ? member.profile
                        : member)
              : null;

          const rawId =
            (details && (details._id || details.id)) ||
            (member && typeof member === 'object' && (member._id || member.id)) ||
            (typeof member === 'string' ? member : null);
          const key = rawId ? String(rawId) : `member-${index}`;

          const firstName = details?.firstName || details?.first_name || member?.firstName;
          const lastName = details?.lastName || details?.last_name || member?.lastName;
          const email = details?.email || member?.email;
          const displayNameRaw =
            details?.fullName ||
            details?.displayName ||
            details?.name ||
            member?.fullName ||
            member?.displayName ||
            member?.name ||
            [firstName, lastName].filter(Boolean).join(' ').trim() ||
            email ||
            // Fall back to the current option list (often has names even when selected entries are id-only)
            optionLabelById.get(key) ||
            'Member';
          const displayName = typeof displayNameRaw === 'string' ? displayNameRaw : String(displayNameRaw);

          return (
            <View key={key} style={styles.selectionChip}>
              <Text style={styles.selectionChipText} numberOfLines={1}>
                {displayName}
              </Text>
              <TouchableOpacity
                onPress={() => onRemove?.(key)}
                style={styles.selectionChipRemove}
                accessibilityLabel={`Remove ${displayName}`}
              >
                <Ionicons name="close" size={12} color={themeVariables.whiteColor} />
              </TouchableOpacity>
            </View>
          );
        })}
        <RNTextInput
          value={searchValue}
          onChangeText={onChangeSearch}
          placeholder={placeholder}
          style={styles.inlineSearchInput}
          placeholderTextColor={restTextInputProps.placeholderTextColor || '#667085'}
          {...restTextInputProps}
          onFocus={event => {
            setIsFocused(true);
            setDropdownVisible(true);
            restTextInputProps.onFocus?.(event);
          }}
          onBlur={event => {
            setIsFocused(false);
            if (!searchValue) {
              setDropdownVisible(false);
            }
            restTextInputProps.onBlur?.(event);
          }}
          selectionColor={themeVariables.primaryColor}
          accessibilityLabel={label || placeholder}
        />
      </View>
      <FormHelperText type="error" visible={!!error}>
        {error}
      </FormHelperText>
        {dropdownVisible && (
        <View style={styles.dropdownList}>
          {loading ? (
            <View style={styles.dropdownLoading}>
              <ActivityIndicator size="small" color={themeVariables.primaryColor} />
              <Text style={styles.dropdownLoadingText}>Loading members…</Text>
            </View>
          ) : error ? (
            <FormHelperText type="error" visible>
              {error}
            </FormHelperText>
          ) : options.length === 0 ? (
            <Text style={styles.dropdownEmpty}>{emptyText}</Text>
          ) : (
            <ScrollView
              style={styles.dropdownScroll}
              contentContainerStyle={styles.dropdownContent}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
            >
              {options.map(option => {
                const key = option._id || option.id;
                const optionLabel =
                  option.fullName ||
                  `${option.firstName || ''} ${option.lastName || ''}`.trim() ||
                  option.email ||
                  'Member';
                return (
                  <TouchableOpacity
                    key={key}
                    style={styles.dropdownOption}
                    onPress={() => {
                      onSelectOption?.(option);
                      setDropdownVisible(true);
                    }}
                  >
                    <Text style={styles.dropdownOptionText}>{optionLabel}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 16,
  },
  sectionLabel: {
    fontWeight: '600',
    fontSize: 16,
    color: themeVariables.blackColor,
    marginBottom: 8,
    paddingLeft: 4,
  },
  selectionInput: {
    minHeight: 54,
    borderWidth: 1,
    borderColor: themeVariables.formInputBorder || '#CBD5E1',
    borderRadius: 12,
    backgroundColor: themeVariables.formInputBg || '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 8,
  },
  selectionInputFocused: {
    borderColor: themeVariables.primaryColor,
    shadowColor: themeVariables.primaryColor,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  selectionInputError: {
    borderColor: themeVariables.formErrorBorder || '#d32f2f',
  },
  selectionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: themeVariables.whiteColor,
    borderWidth: 1,
    borderColor: themeVariables.primaryColor,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  selectionChipText: {
    color: themeVariables.primaryColor,
    marginRight: 8,
    maxWidth: 180,
    flexShrink: 1,
  },
  selectionChipRemove: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: themeVariables.primaryColor,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineSearchInput: {
    flex: 1,
    minWidth: 80,
    paddingVertical: 6,
    color: themeVariables.blackColor,
    fontSize: 16,
  },
  dropdownList: {
    borderWidth: 1,
    borderColor: themeVariables.formInputBorder || '#CBD5E1',
    borderRadius: 12,
    backgroundColor: themeVariables.whiteColor,
    maxHeight: 220,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  dropdownScroll: {
    maxHeight: 220,
  },
  dropdownContent: {
    paddingBottom: 6,
  },
  dropdownLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  dropdownLoadingText: {
    marginLeft: 8,
    color: themeVariables.darkGreyColor || '#666',
  },
  dropdownEmpty: {
    padding: 12,
    color: themeVariables.darkGreyColor || '#666',
  },
  dropdownOption: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: themeVariables.borderLightColor || '#ededed',
  },
  dropdownOptionText: {
    color: themeVariables.blackColor,
    fontSize: 15,
  },
});

export default MultiSelectMemberInput;

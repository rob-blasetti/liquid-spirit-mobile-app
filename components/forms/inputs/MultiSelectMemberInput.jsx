import React, { useState } from 'react';
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
  onSelectOption,
  loading,
  error,
  emptyText = 'No matching members.',
  style,
  textInputProps,
}) => {
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const { style: inputStyle, ...restTextInputProps } = textInputProps || {};

  return (
    <View style={[styles.wrapper, style]}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <View style={[styles.selectionInput, inputStyle]}>
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
          placeholderTextColor={restTextInputProps.placeholderTextColor || themeVariables.darkGreyColor || '#222'}
          {...restTextInputProps}
          onFocus={() => setDropdownVisible(true)}
          onBlur={() => {
            if (!searchValue) {
              setDropdownVisible(false);
            }
          }}
        />
      </View>
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
    minHeight: 50,
    borderWidth: 1,
    borderColor: themeVariables.borderLightColor || '#dcdcdc',
    borderRadius: 8,
    backgroundColor: themeVariables.lightGreyColor || '#f3f3f3',
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 8,
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
  },
  dropdownList: {
    borderWidth: 1,
    borderColor: themeVariables.borderLightColor || '#dcdcdc',
    borderRadius: 4,
    backgroundColor: themeVariables.whiteColor,
    maxHeight: 220,
    overflow: 'hidden',
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
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: themeVariables.borderLightColor || '#ededed',
  },
  dropdownOptionText: {
    color: themeVariables.blackColor,
  },
});

export default MultiSelectMemberInput;

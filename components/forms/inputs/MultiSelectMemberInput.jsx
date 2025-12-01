import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, TextInput as RNTextInput, ScrollView } from 'react-native';
import { HelperText } from 'react-native-paper';
import Ionicons from 'react-native-vector-icons/Ionicons';

import themeVariables from '../../../styles/theme';

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
        {selected.map(member => {
          const key = member._id || member.id;
          const displayName =
            member.fullName ||
            `${member.firstName || ''} ${member.lastName || ''}`.trim() ||
            member.email ||
            'Member';
          return (
            <View key={key} style={styles.selectionChip}>
              <Text style={styles.selectionChipText}>
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
            <HelperText type="error" visible>
              {error}
            </HelperText>
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
    borderRadius: 4,
    backgroundColor: themeVariables.whiteColor,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
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

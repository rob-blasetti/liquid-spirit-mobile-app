import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { TextInput, HelperText } from 'react-native-paper';
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
}) => {
  const [dropdownVisible, setDropdownVisible] = useState(false);

  return (
    <View style={[styles.wrapper, style]}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <View style={styles.selectionRow}>
        {selected.length === 0 ? (
          <Text style={styles.selectionPlaceholder}>No selections yet</Text>
        ) : (
          selected.map(member => {
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
          })
        )}
      </View>
      <TextInput
        label="Search community members"
        mode="outlined"
        value={searchValue}
        onChangeText={onChangeSearch}
        placeholder={placeholder}
        style={styles.searchInput}
        onFocus={() => setDropdownVisible(true)}
        onBlur={() => {
          if (!searchValue) {
            setDropdownVisible(false);
          }
        }}
      />
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
          options.map(option => {
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
                  setDropdownVisible(false);
                }}
              >
                <Text style={styles.dropdownOptionText}>{optionLabel}</Text>
              </TouchableOpacity>
            );
          })
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
    color: themeVariables.blackColor,
    marginBottom: 8,
  },
  selectionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  selectionPlaceholder: {
    color: themeVariables.darkGreyColor || '#7b7b7b',
    fontStyle: 'italic',
  },
  selectionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: (themeVariables.primaryColor || '#007aff') + '20',
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  selectionChipText: {
    color: themeVariables.blackColor,
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
  searchInput: {
    marginBottom: 8,
  },
  dropdownList: {
    borderWidth: 1,
    borderColor: themeVariables.borderLightColor || '#dcdcdc',
    borderRadius: 8,
    backgroundColor: themeVariables.whiteColor,
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

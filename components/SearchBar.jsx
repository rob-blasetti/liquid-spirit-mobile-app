import React, { forwardRef } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, Text } from 'react-native';
import themeVariables from '../styles/theme';

const SearchBar = forwardRef(
  (
    {
      value,
      placeholder = 'Search...',
      onChangeText,
      onSubmitEditing,
      onFocus,
      onBlur,
      showSpinner = false,
      showCancel = false,
      onCancel,
      isFocused = false,
      returnKeyType = 'search',
      autoCapitalize = 'none',
      autoCorrect = false,
      containerStyle,
      inputContainerStyle,
      inputStyle,
      testID,
      placeholderTextColor = '#7a7a7a',
    },
    ref,
  ) => {
    return (
      <View style={[styles.searchBarRow, containerStyle]}>
        <View
          style={[
            styles.searchInputContainer,
            showCancel && !isFocused && styles.searchInputContainerCollapsed,
            inputContainerStyle,
          ]}
        >
          <TextInput
            ref={ref}
            style={[styles.searchInput, inputStyle]}
            placeholder={placeholder}
            value={value}
            onChangeText={onChangeText}
            onSubmitEditing={onSubmitEditing}
            onFocus={onFocus}
            onBlur={onBlur}
            returnKeyType={returnKeyType}
            autoCapitalize={autoCapitalize}
            autoCorrect={autoCorrect}
            placeholderTextColor={placeholderTextColor}
            testID={testID}
          />
          {showSpinner ? (
            <ActivityIndicator
              size="small"
              color={themeVariables.primaryColor}
              style={styles.searchSpinner}
            />
          ) : null}
        </View>
        {showCancel ? (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onCancel}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  },
);

export default SearchBar;

const styles = StyleSheet.create({
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginHorizontal: 12,
    marginTop: 8,
  },
  searchInputContainer: {
    flex: 1,
    marginRight: 12,
    position: 'relative',
  },
  searchInputContainerCollapsed: {
    marginRight: 0,
  },
  searchInput: {
    height: 48,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderColor: themeVariables.blackColor,
    borderWidth: 1,
    borderRadius: 20,
    backgroundColor: themeVariables.whiteColor,
    paddingRight: 40,
    width: '100%',
    color: '#4a4a4a',
  },
  searchSpinner: {
    position: 'absolute',
    right: 24,
    top: 24,
    marginTop: -10,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  cancelButtonText: {
    color: themeVariables.primaryColor,
    fontSize: 16,
  },
});

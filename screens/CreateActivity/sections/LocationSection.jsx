import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text, HelperText, Title } from 'react-native-paper';

import DropdownInput from '../../../components/forms/inputs/DropdownInput';
import FormTextInput from '../../../components/forms/inputs/FormTextInput';

const LocationSection = ({
  form,
  errors,
  baseInputProps,
  styledInputProps,
  stateOptions,
  onChangeLocationMode,
  onChangeOnlineLink,
  onChangeAddressField,
  onSelectState,
  styles,
}) => (
  <>
    <Title style={styles.sectionLabel}>Location</Title>
    <View style={styles.locationModeRow}>
      {[
        { key: 'online', label: 'Online' },
        { key: 'inPerson', label: 'In Person' },
        { key: 'both', label: 'Both' },
      ].map(option => {
        const active = form.locationMode === option.key;
        return (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.locationModeButton,
              active && styles.locationModeButtonActive,
            ]}
            onPress={() => onChangeLocationMode(option.key)}
          >
            <Text
              style={[
                styles.locationModeText,
                active && styles.locationModeTextActive,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>

    {(form.locationMode === 'online' || form.locationMode === 'both') && (
      <>
        <Title style={[styles.sectionLabel, styles.locationSubLabel]}>Online meeting</Title>
        <FormTextInput
          inputProps={baseInputProps}
          label=""
          value={form.onlineLink}
          onChangeText={onChangeOnlineLink}
          error={!!errors.onlineLink}
          style={styles.input}
        />
        <HelperText type="info" visible>
          Paste a video or meeting link attendees can join.
        </HelperText>
        <HelperText type="error" visible={!!errors.onlineLink}>
          {errors.onlineLink}
        </HelperText>
      </>
    )}

    {(form.locationMode === 'inPerson' || form.locationMode === 'both') && (
      <>
        <Title style={[styles.sectionLabel, styles.addressSectionLabel]}>In-person location</Title>
        <FormTextInput
          inputProps={baseInputProps}
          label="Street Address"
          value={form.address.streetAddress}
          onChangeText={(t) => onChangeAddressField('streetAddress', t)}
          style={[styles.input, styles.addressInput]}
          error={!!errors.streetAddress}
        />
        <HelperText type="info" visible>
          Enter the venue’s street address.
        </HelperText>
        <HelperText type="error" visible={!!errors.streetAddress}>
          {errors.streetAddress}
        </HelperText>
        <View style={styles.addressRow}>
          <FormTextInput
            inputProps={baseInputProps}
            label="Suburb"
            value={form.address.suburb}
            onChangeText={(t) => onChangeAddressField('suburb', t)}
            style={[styles.input, styles.addressInput, styles.rowInput]}
          />
          <FormTextInput
            inputProps={baseInputProps}
            label="City"
            value={form.address.city}
            onChangeText={(t) => onChangeAddressField('city', t)}
            style={[styles.input, styles.addressInput, styles.rowInput, styles.lastInRow]}
            error={!!errors.city}
          />
        </View>
        <HelperText type="info" visible>
          Add suburb and city so people can find it.
        </HelperText>
        <HelperText type="error" visible={!!errors.city}>
          {errors.city}
        </HelperText>
        <View style={styles.addressRow}>
          <DropdownInput
            label="State"
            value={form.address.state}
            options={stateOptions}
            placeholder="Select state"
            onSelect={onSelectState}
            textInputProps={{ ...styledInputProps, style: [styles.input, styles.addressInput] }}
            style={[styles.rowInput, styles.addressDropdown]}
          />
          <FormTextInput
            inputProps={baseInputProps}
            label="Postal Code"
            value={form.address.postalCode}
            onChangeText={(t) => onChangeAddressField('postalCode', t)}
            keyboardType="number-pad"
            style={[styles.input, styles.addressInput, styles.rowInput, styles.lastInRow]}
          />
        </View>
        <HelperText type="info" visible>
          State and postcode help map the location accurately.
        </HelperText>
        <HelperText type="error" visible={!!errors.state}>
          {errors.state}
        </HelperText>
      </>
    )}
  </>
);

export default LocationSection;

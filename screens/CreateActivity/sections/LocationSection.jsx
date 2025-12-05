import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';

import FormTextInput from '../../../components/forms/inputs/FormTextInput';
import VenueSelect from '../../../components/forms/inputs/VenueSelect';
import { Row } from '../../../components/layout/Stack';
import themeVariables from '../../../styles/theme';

const LocationSection = ({
  form,
  errors,
  baseInputProps,
  styledInputProps,
  onChangeLocationMode,
  onChangeOnlineLink,
  onSelectVenue,
  venueSelectProps = {},
  venuePlaceholder = 'Where will it be?',
  styles,
}) => (
  <>
    <Text style={styles.sectionLabel}>Location</Text>
    <Row gap={themeVariables.spacing.s} style={styles.locationModeRow}>
      {[
        { key: 'inPerson', label: 'In Person' },
        { key: 'online', label: 'Online' },
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
    </Row>

    {(form.locationMode === 'online' || form.locationMode === 'both') && (
      <>
        <Text style={[styles.sectionLabel, styles.locationSubLabel]}>Online meeting</Text>
        <FormTextInput
          inputProps={baseInputProps}
          label=""
          value={form.onlineLink}
          onChangeText={onChangeOnlineLink}
          error={!!errors.onlineLink}
          errorText={errors.onlineLink}
          helperText="Paste a video or meeting link attendees can join."
          style={styles.input}
        />
      </>
    )}

    {(form.locationMode === 'inPerson' || form.locationMode === 'both') && (
      <>
        <Text style={[styles.sectionLabel, styles.addressSectionLabel]}>In-person location</Text>
        <VenueSelect
          {...venueSelectProps}
          value={form.venueId}
          onSelect={onSelectVenue}
          validationError={errors.venueId}
          placeholder={venuePlaceholder}
          inputProps={{ ...styledInputProps, style: [styles.input, styles.addressInput] }}
          helperSpacing={0}
          style={styles.addressInput}
        />
      </>
    )}
  </>
);

export default LocationSection;

import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text, Title } from 'react-native-paper';

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
  useVenueSelect = false,
  venueSelectProps = {},
  venuePlaceholder = 'Where will it be?',
  styles,
}) => (
  <>
    <Title style={styles.sectionLabel}>Location</Title>
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
        <Title style={[styles.sectionLabel, styles.locationSubLabel]}>Online meeting</Title>
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
        <Title style={[styles.sectionLabel, styles.addressSectionLabel]}>In-person location</Title>
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

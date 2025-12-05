import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';

import { fetchAvailableVenuesForActivity, fetchVenues } from '../../../services/VenueService';
import DropdownInput from './DropdownInput';
import FormHelperText from './FormHelperText';

const buildOptionLabel = (venue) => {
  const name = venue?.name || venue?.title || venue?.label || 'Venue';
  const addressParts = [
    venue?.address?.streetAddress || venue?.address?.street,
    venue?.address?.suburb,
    venue?.address?.city,
  ].filter(Boolean);
  const subtitle = addressParts.join(', ');
  return subtitle ? `${name} — ${subtitle}` : name;
};

const VenueSelect = ({
  activityId,
  communityId,
  token,
  value,
  onSelect,
  onLoadingChange,
  validationError,
  placeholder = 'Where will it be?',
  helperText = 'Choose a venue for the in-person session.',
  inputProps,
  style,
  helperSpacing = 0,
}) => {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  const loadVenues = useCallback(
    async (signal) => {
      setLoading(true);
      setFetchError('');
      try {
        if (!token) {
          setOptions([]);
          setLoading(false);
          return;
        }
        let venues = [];
        if (activityId) {
          venues = await fetchAvailableVenuesForActivity(activityId, token, { signal });
        }
        if ((!Array.isArray(venues) || venues.length === 0) && communityId) {
          const communityVenues = await fetchVenues(communityId, token, { signal });
          if (Array.isArray(communityVenues)) {
            venues = communityVenues;
          }
        }
        const normalized = Array.isArray(venues) ? venues : [];
        setOptions(normalized);
      } catch (err) {
        if (err?.name === 'AbortError') return;
        const message = err?.message || 'Unable to load venues.';
        setFetchError(message);
        setOptions([]);
      } finally {
        setLoading(false);
      }
    },
    [activityId, communityId, token],
  );

  useEffect(() => {
    const controller = new AbortController();
    loadVenues(controller.signal);
    return () => controller.abort();
  }, [loadVenues]);

  useEffect(() => {
    onLoadingChange?.(loading);
  }, [loading, onLoadingChange]);

  const dropdownOptions = useMemo(
    () =>
      options.map((venue, index) => ({
        label: buildOptionLabel(venue),
        value: String(venue?._id || venue?.id || venue?.venueId || index),
        meta: venue,
      })),
    [options],
  );

  return (
    <View style={style}>
      <DropdownInput
        label=""
        value={value}
        options={dropdownOptions}
        placeholder={loading ? 'Loading venues...' : placeholder}
        onSelect={(selectedValue, venue) => onSelect?.(selectedValue, venue)}
        disabled={loading || dropdownOptions.length === 0}
        textInputProps={inputProps}
      />
      <FormHelperText type={fetchError ? 'error' : 'info'} visible>
        {fetchError ||
          (loading && 'Loading venues...') ||
          (!loading && dropdownOptions.length === 0 && !validationError && 'No saved venues found. Add one to select it here.') ||
          (!loading && validationError) ||
          helperText}
      </FormHelperText>
      {validationError && !fetchError && (
        <FormHelperText type="error" visible>
          {validationError}
        </FormHelperText>
      )}
    </View>
  );
};

export default VenueSelect;

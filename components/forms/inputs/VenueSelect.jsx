import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';

import { fetchEligibleVenuesForActivity, fetchVenues, findVenuesForIds } from '../../../services/VenueService';
import DropdownInput from './DropdownInput';
import FormHelperText from './FormHelperText';
import { resolveEntryId } from '../../../screens/DetailCard/Activity/utils/memberUtils';
import { VenuesContext } from '../../../contexts/VenuesContext';

const toArray = (value) => (Array.isArray(value) ? value : []);
const EMPTY_IDS = Object.freeze([]);

const normalizeVenue = (entry) => {
  const venue = entry?.venue || entry;
  if (!venue || typeof venue !== 'object') return null;
  return {
    ...venue,
    disabled: Boolean(entry?.disabled),
    disabledReason: entry?.reason || entry?.disabledReason || null,
    requestable: entry?.requestability?.requestable ?? entry?.requestable,
    requestableReason: entry?.requestability?.reason || entry?.requestableReason || null,
  };
};

const mergeVenues = (...lists) => {
  const map = new Map();
  lists.flat().forEach((entry, index) => {
    const venue = normalizeVenue(entry);
    if (!venue) return;
    const key = String(venue?._id || venue?.id || venue?.venueId || `venue-${index}`);
    if (!map.has(key)) {
      map.set(key, venue);
    }
  });
  return Array.from(map.values());
};

const isCommunityVenue = (venue) => {
  const type = String(venue?.type || venue?.venueType || venue?.typeLabel || '').trim().toLowerCase();
  return type === 'communityvenue' || type === 'community venue' || type === 'community';
};

const isResidenceVenue = (venue) => {
  const type = String(venue?.type || venue?.venueType || venue?.typeLabel || '').trim().toLowerCase();
  return type === 'residence' || type === 'household' || type === 'residential';
};

const getVenueTitle = (venue) => venue?.name || venue?.title || venue?.label || 'Venue';

const getVenueAddress = (venue) => {
  const addressParts = [
    venue?.address?.streetAddress || venue?.address?.street,
    venue?.address?.suburb,
    venue?.address?.city,
  ].filter(Boolean);
  return addressParts.join(', ');
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
  helperSpacing: _helperSpacing = 0,
  facilitatorIds = EMPTY_IDS,
  participantIds = EMPTY_IDS,
  userId,
}) => {
  const { venues: cachedVenues = [], loading: cachedVenuesLoading, error: cachedVenuesError } = useContext(VenuesContext);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  const resolvedFacilitatorIds = useMemo(
    () => toArray(facilitatorIds).map(resolveEntryId).filter(Boolean),
    [facilitatorIds],
  );
  const resolvedParticipantIds = useMemo(
    () => toArray(participantIds).map(resolveEntryId).filter(Boolean),
    [participantIds],
  );
  const cachedCommunityVenues = useMemo(
    () => mergeVenues(cachedVenues).filter(isCommunityVenue),
    [cachedVenues],
  );

  useEffect(() => {
    setOptions((prev) => {
      const residenceVenues = mergeVenues(prev).filter(isResidenceVenue);
      return mergeVenues(cachedCommunityVenues, residenceVenues);
    });
  }, [cachedCommunityVenues]);

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
        let communityVenues = cachedCommunityVenues;
        if (activityId) {
          try {
            const eligible = await fetchEligibleVenuesForActivity(activityId, token, { signal });
            communityVenues = mergeVenues(toArray(eligible))
              .filter(isCommunityVenue);
          } catch (err) {
            if (err?.name === 'AbortError') return;
            if (__DEV__) {
              console.warn('[VenueSelect] eligible venues unavailable, falling back to community venues', {
                activityId,
                message: err?.message,
              });
            }
          }
        }
        if ((!Array.isArray(communityVenues) || communityVenues.length === 0) && communityId) {
          const fetchedCommunityVenues = await fetchVenues(communityId, token, { signal });
          if (Array.isArray(fetchedCommunityVenues)) {
            communityVenues = mergeVenues(fetchedCommunityVenues).filter(isCommunityVenue);
          }
        }

        let residenceVenues = [];
        if (resolvedFacilitatorIds.length || resolvedParticipantIds.length) {
          const related = await findVenuesForIds(
            resolvedFacilitatorIds,
            resolvedParticipantIds,
            token,
            { signal, userId },
          );
          residenceVenues = mergeVenues(toArray(related))
            .filter(isResidenceVenue)
            .filter((venue) => !venue?.disabled && venue?.requestable !== false);
        }

        setOptions(mergeVenues(communityVenues, residenceVenues));
      } catch (err) {
        if (err?.name === 'AbortError') return;
        const message = err?.message || 'Unable to load venues.';
        setFetchError(message);
        setOptions([]);
      } finally {
        setLoading(false);
      }
    },
    [activityId, cachedCommunityVenues, communityId, token, resolvedFacilitatorIds, resolvedParticipantIds, userId],
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
        label: getVenueTitle(venue),
        title: getVenueTitle(venue),
        subtitle: getVenueAddress(venue),
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
        placeholder={loading && dropdownOptions.length === 0 ? 'Loading venues...' : placeholder}
        onSelect={(selectedValue, venue) => onSelect?.(selectedValue, venue)}
        disabled={loading && dropdownOptions.length === 0}
        textInputProps={inputProps}
      />
      <FormHelperText type={fetchError ? 'error' : 'info'} visible>
        {fetchError ||
          (loading && options.length === 0 && (cachedVenuesLoading ? 'Loading venues...' : 'Loading venue details...')) ||
          (!fetchError && cachedVenuesError && options.length === 0 && cachedVenuesError) ||
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

import { useEffect, useMemo, useState } from 'react';

import { coalesceString, normalizeString } from '../utils/activityHelpers';
import {
  getDisplayAddress,
  getRegionForMap,
  resolveCoordinates,
  normalizeAddress,
} from '../utils/locationUtils';

const toRegion = (value) => {
  const point = resolveCoordinates(value);
  if (!point) return null;
  return {
    latitude: point.latitude,
    longitude: point.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };
};

const useActivityLocation = ({ activity, nextSession }) => {
  const [region, setRegion] = useState(null);

  const sessionVenues = Array.isArray(nextSession?.normalizedVenues)
    ? nextSession.normalizedVenues
    : Array.isArray(nextSession?.venues)
      ? nextSession.venues
      : [];
  const sessionVenueAddress =
    sessionVenues.map(venue => venue?.address).find(addr => normalizeAddress(addr).length > 0) || null;

  const mapAddressSource =
    sessionVenueAddress ||
    nextSession?.primaryVenue?.address ||
    nextSession?.address ||
    activity?.address;

  const mapAddress = normalizeAddress(mapAddressSource);
  const mapDisplayName = coalesceString(
    nextSession?.displayName,
    nextSession?.primaryVenue?.name,
    activity?.title,
    'Upcoming Session'
  );
  const mapDisplayAddress = getDisplayAddress({
    sessionAddress: sessionVenueAddress || nextSession?.address || nextSession?.primaryVenue?.address,
    activityAddress: activity?.address,
  });

  const primaryVenue = nextSession?.primaryVenue;
  const venueWithCoords = sessionVenues.find(
    venue => toRegion(venue?.coordinates || venue?.location || venue?.address)
  );

  const staticRegion = useMemo(() => (
    getRegionForMap(mapAddressSource) ||
    getRegionForMap(primaryVenue) ||
    (venueWithCoords ? getRegionForMap(venueWithCoords) : null) ||
    toRegion(nextSession?.coordinates) ||
    toRegion(activity?.addressCoordinates) ||
    toRegion(activity?.address) ||
    null
  ), [activity?.address, activity?.addressCoordinates, mapAddressSource, nextSession?.coordinates, primaryVenue, venueWithCoords]);

  const sessionOnlineLink = normalizeString(nextSession?.onlineLink || activity?.onlineLink);
  const resolvedOnlineLink = sessionOnlineLink
    ? /^https?:\/\//i.test(sessionOnlineLink)
      ? sessionOnlineLink
      : `https://${sessionOnlineLink}`
    : '';

  const showOnlineSection = resolvedOnlineLink.length > 0;
  const hasPhysicalSessionLocation = Boolean(region || staticRegion) || mapAddress.length > 0;
  const isHybridSession = showOnlineSection && hasPhysicalSessionLocation;
  const showMapSection = hasPhysicalSessionLocation;

  useEffect(() => {
    if (!staticRegion) return;
    setRegion(prev => {
      if (prev && prev.latitude === staticRegion.latitude && prev.longitude === staticRegion.longitude) {
        return prev;
      }
      return staticRegion;
    });
  }, [staticRegion]);

  useEffect(() => {
    if (region || mapAddress.length === 0) return;
    let cancelled = false;
    const q = encodeURIComponent(mapAddress);
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${q}`, {
      headers: {
        'User-Agent': 'LiquidSpiritApp/1.0 (info@liquidspirit.org)',
        'Accept-Language': 'en',
      },
    })
      .then(res => res.json())
      .then(results => {
        if (cancelled) return;
        if (results && results.length > 0) {
          const { lat, lon } = results[0] || {};
          const parsed = {
            latitude: parseFloat(lat),
            longitude: parseFloat(lon),
          };
          const nextRegion = toRegion(parsed);
          if (nextRegion) {
            setRegion(nextRegion);
          }
        }
      })
      .catch(err => {
        if (__DEV__) console.warn('Activity map geocode failed', err);
      });
    return () => {
      cancelled = true;
    };
  }, [region, mapAddress]);

  return {
    hasRegion: Boolean(region || staticRegion),
    mapAddress,
    mapDisplayName,
    mapDisplayAddress,
    region: region || staticRegion,
    resolvedOnlineLink,
    showOnlineSection,
    showMapSection,
    isHybridSession,
  };
};

export default useActivityLocation;

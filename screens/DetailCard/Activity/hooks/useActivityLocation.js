import { useEffect, useMemo, useState } from 'react';

import { coalesceString, normalizeString } from '../utils/activityHelpers';
import {
  getDisplayAddress,
  getRegionForMap,
  resolveCoordinates,
  normalizeAddress,
} from '../utils/locationUtils';
import { buildMapRegion, normalizeMapRegion } from '../../common/mapRegion';

const toRegion = (value) => {
  const point = resolveCoordinates(value);
  if (!point) return null;
  return buildMapRegion(point);
};

const useActivityLocation = ({ activity, nextSession }) => {
  const [geocodedRegion, setGeocodedRegion] = useState(null);

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
    normalizeMapRegion(
      getRegionForMap(mapAddressSource) ||
      getRegionForMap(primaryVenue) ||
      (venueWithCoords ? getRegionForMap(venueWithCoords) : null) ||
      toRegion(nextSession?.coordinates) ||
      toRegion(activity?.addressCoordinates) ||
      toRegion(activity?.address) ||
      null
    )
  ), [activity?.address, activity?.addressCoordinates, mapAddressSource, nextSession?.coordinates, primaryVenue, venueWithCoords]);

  const sessionOnlineLink = normalizeString(nextSession?.onlineLink || activity?.onlineLink);
  const resolvedOnlineLink = sessionOnlineLink
    ? /^https?:\/\//i.test(sessionOnlineLink)
      ? sessionOnlineLink
      : `https://${sessionOnlineLink}`
    : '';

  const showOnlineSection = resolvedOnlineLink.length > 0;
  const resolvedRegion = staticRegion || geocodedRegion;
  const hasPhysicalSessionLocation = Boolean(resolvedRegion) || mapAddress.length > 0;
  const isHybridSession = showOnlineSection && hasPhysicalSessionLocation;
  const showMapSection = hasPhysicalSessionLocation;

  useEffect(() => {
    if (staticRegion || geocodedRegion || mapAddress.length === 0) return;
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
          const nextRegion = buildMapRegion({
            latitude: parseFloat(lat),
            longitude: parseFloat(lon),
          });
          if (nextRegion) {
            setGeocodedRegion(nextRegion);
          }
        }
      })
      .catch(err => {
        if (__DEV__) console.warn('Activity map geocode failed', err);
      });
    return () => {
      cancelled = true;
    };
  }, [staticRegion, geocodedRegion, mapAddress]);

  return {
    hasRegion: Boolean(resolvedRegion),
    mapAddress,
    mapDisplayName,
    mapDisplayAddress,
    region: resolvedRegion,
    resolvedOnlineLink,
    showOnlineSection,
    showMapSection,
    isHybridSession,
  };
};

export default useActivityLocation;

import { useEffect, useMemo, useState } from 'react';

import { coalesceString, normalizeString } from '../utils/activityHelpers';
import {
  getDisplayAddress,
  getRegionForMap,
  resolveCoordinates,
  normalizeAddress,
} from '../utils/locationUtils';
import { buildMapRegion, normalizeMapRegion } from '../../common/mapRegion';
import debugLog from '../../../../utils/debugLog';

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
    debugLog('[ActivityDetailMap] location inputs', {
      activityId: activity?._id || activity?.id || null,
      nextSessionId: nextSession?._id || nextSession?.id || null,
      mapAddress,
      mapDisplayName,
      mapDisplayAddress,
      staticRegion,
      geocodedRegion,
      resolvedRegion,
      hasPhysicalSessionLocation,
      showMapSection,
      showOnlineSection,
      isHybridSession,
    });
  }, [
    activity?._id,
    activity?.id,
    geocodedRegion,
    hasPhysicalSessionLocation,
    isHybridSession,
    mapAddress,
    mapDisplayAddress,
    mapDisplayName,
    nextSession?._id,
    nextSession?.id,
    resolvedRegion,
    showMapSection,
    showOnlineSection,
    staticRegion,
  ]);

  useEffect(() => {
    if (staticRegion || geocodedRegion || mapAddress.length === 0) return;
    let cancelled = false;
    const q = encodeURIComponent(mapAddress);
    debugLog('[ActivityDetailMap] geocode start', {
      mapAddress,
      query: q,
    });
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${q}`, {
      headers: {
        'User-Agent': 'LiquidSpiritApp/1.0 (info@liquidspirit.org)',
        'Accept-Language': 'en',
      },
    })
      .then(res => res.json())
      .then(results => {
        if (cancelled) return;
        debugLog('[ActivityDetailMap] geocode results', {
          mapAddress,
          resultCount: Array.isArray(results) ? results.length : 0,
          firstResult: Array.isArray(results) ? results[0] : null,
        });
        if (results && results.length > 0) {
          const { lat, lon } = results[0] || {};
          const nextRegion = buildMapRegion({
            latitude: parseFloat(lat),
            longitude: parseFloat(lon),
          });
          if (nextRegion) {
            debugLog('[ActivityDetailMap] geocode resolved region', {
              mapAddress,
              nextRegion,
            });
            setGeocodedRegion(nextRegion);
          }
        }
      })
      .catch(err => {
        debugLog('[ActivityDetailMap] geocode failed', {
          mapAddress,
          message: err?.message,
          name: err?.name,
        });
        if (__DEV__) console.warn('Activity map geocode failed', err);
      });
    return () => {
      cancelled = true;
      debugLog('[ActivityDetailMap] geocode cancelled', {
        mapAddress,
      });
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

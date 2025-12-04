import { useMemo } from 'react';

import { coalesceString, normalizeString } from '../utils/activityHelpers';
import {
  getDisplayAddress,
  getRegionForMap,
  normalizeAddress,
} from '../utils/locationUtils';

const useActivityLocation = ({ activity, nextSession }) => useMemo(() => {
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

  const region =
    getRegionForMap(mapAddressSource) ||
    getRegionForMap(activity?.address);

  const sessionOnlineLink = normalizeString(nextSession?.onlineLink || activity?.onlineLink);
  const resolvedOnlineLink = sessionOnlineLink
    ? /^https?:\/\//i.test(sessionOnlineLink)
      ? sessionOnlineLink
      : `https://${sessionOnlineLink}`
    : '';

  const showOnlineSection = resolvedOnlineLink.length > 0;
  const hasPhysicalSessionLocation = Boolean(region) || mapAddress.length > 0;
  const isHybridSession = showOnlineSection && hasPhysicalSessionLocation;
  const showMapSection = hasPhysicalSessionLocation;

  return {
    mapAddress,
    mapDisplayName,
    mapDisplayAddress,
    region,
    resolvedOnlineLink,
    showOnlineSection,
    showMapSection,
    isHybridSession,
  };
}, [activity, nextSession]);

export default useActivityLocation;

import { useMemo } from 'react';

import { coalesceString, normalizeString } from '../utils/activityHelpers';
import {
  getDisplayAddress,
  getRegionForMap,
  normalizeAddress,
} from '../utils/locationUtils';

const useActivityLocation = ({ activity, nextSession }) => useMemo(() => {
  const mapAddressSource =
    nextSession?.address ||
    nextSession?.primaryVenue?.address ||
    activity?.address;

  const mapAddress = normalizeAddress(mapAddressSource);
  const mapDisplayName = coalesceString(
    nextSession?.displayName,
    nextSession?.primaryVenue?.name,
    activity?.title,
    'Upcoming Session'
  );
  const mapDisplayAddress = getDisplayAddress({
    sessionAddress: mapAddressSource,
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

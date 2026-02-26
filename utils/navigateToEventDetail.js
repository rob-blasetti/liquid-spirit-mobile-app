import { fetchEventDetails } from '../services/EventService';
import { navigateWithinMainTabs } from './navigateWithTabs';

/**
 * Navigate to the EventDetailCard screen while prefetching the latest details.
 * Falls back to the provided event data immediately so users see content without
 * waiting for the network request to finish.
 */
export const navigateToEventDetail = async ({
  navigation,
  event,
  eventId,
  token,
  isTokenExpired,
}) => {
  if (!navigation) return;

  const id = event?._id || event?.id || eventId;
  if (!event && !id) return;

  const baseParams = {};
  if (event) {
    baseParams.eventPreload = event;
  }
  if (id) {
    baseParams.eventId = id;
  }

  const { usedFallback, targetNavigation } = navigateWithinMainTabs({
    navigation,
    screen: 'EventDetailCard',
    tab: 'Home',
    params: baseParams,
  });

  // For card/list navigations we already pass a preload event payload.
  // Let EventDetailCard handle post-transition refresh to avoid transition jank.
  if (event) {
    return;
  }

  if (!id || !token || (typeof isTokenExpired === 'function' && isTokenExpired(token))) {
    return;
  }

  if (usedFallback || !targetNavigation) {
    return;
  }

  try {
    const detailed = await fetchEventDetails(id, token);
    if (detailed) {
      targetNavigation.navigate({
        name: 'EventDetailCard',
        params: { eventPreload: detailed },
        merge: true,
      });
    }
  } catch (err) {
    if (__DEV__) {
      console.warn('Prefetch event detail failed:', err);
    }
  }
};

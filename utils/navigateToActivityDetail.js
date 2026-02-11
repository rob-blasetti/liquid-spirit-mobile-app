import { fetchActivityDetails } from '../services/ActivityService';
import { navigateWithinMainTabs } from './navigateWithTabs';

/**
 * Navigate to ActivityDetailCard while prefetching latest details.
 * Falls back to provided activity data immediately so users see content without waiting.
 */
export const navigateToActivityDetail = async ({
  navigation,
  activity,
  activityId,
  activityPreload,
  token,
  isTokenExpired,
  params = {},
}) => {
  if (!navigation) return;

  const id =
    activity?._id ||
    activity?.id ||
    activityId ||
    activityPreload?._id ||
    params?.activityId;

  if (!activity && !activityPreload && !id) return;

  const baseParams = {
    ...params,
  };

  if (activity || activityPreload) {
    baseParams.activityPreload = activity || activityPreload;
  }

  if (id) {
    baseParams.activityId = id;
  }

  const { usedFallback, targetNavigation } = navigateWithinMainTabs({
    navigation,
    tab: 'Home',
    screen: 'ActivityDetailCard',
    params: baseParams,
  });

  if (!id || !token || (typeof isTokenExpired === 'function' && isTokenExpired(token))) {
    return;
  }

  if (usedFallback || !targetNavigation) {
    return;
  }

  try {
    const detailed = await fetchActivityDetails(id, token);
    if (detailed) {
      targetNavigation.navigate({
        name: 'ActivityDetailCard',
        params: { activityPreload: detailed },
        merge: true,
      });
    }
  } catch (err) {
    if (__DEV__) {
      console.warn('Prefetch activity detail failed:', err);
    }
  }
};

import { navigateWithinMainTabs } from './navigateWithTabs';

export const navigateToActivityDetail = ({
  navigation,
  activity,
  activityId,
  activityPreload,
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

  navigateWithinMainTabs({
    navigation,
    tab: 'Home',
    screen: 'ActivityDetailCard',
    params: baseParams,
  });
};

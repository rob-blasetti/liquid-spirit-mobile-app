const findNavigatorWithRoute = (navigation, routeName) => {
  let current = navigation;

  while (current) {
    const state = typeof current.getState === 'function' ? current.getState() : null;
    const routeNames = state?.routeNames;

    if (Array.isArray(routeNames) && routeNames.includes(routeName)) {
      return current;
    }

    current = typeof current.getParent === 'function' ? current.getParent() : null;
  }

  return null;
};

/**
 * Navigate to a screen that lives inside the Main bottom tab stacks.
 * Returns an object describing whether we fell back to the root-level
 * navigation (meaning the caller does not have immediate access to the
 * target route).
 */
export const navigateWithinMainTabs = ({
  navigation,
  screen,
  params = {},
  tab = 'Home',
}) => {
  if (!navigation || !screen) {
    return { usedFallback: true, targetNavigation: null };
  }

  const targetNavigation = findNavigatorWithRoute(navigation, screen);

  if (targetNavigation) {
    targetNavigation.navigate(screen, params);
    return { usedFallback: false, targetNavigation };
  }

  navigation.navigate('Main', {
    screen: tab,
    params: {
      screen,
      params,
    },
  });

  return { usedFallback: true, targetNavigation: null };
};

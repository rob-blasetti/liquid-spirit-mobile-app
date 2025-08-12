import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

export function navigate(name, params) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  }
}

// Queue a single pending navigation if container isn't ready yet
let pendingNav = null;
export function navigateWhenReady(name, params) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  } else {
    pendingNav = { name, params };
  }
}

export function flushPendingNavigation() {
  if (pendingNav && navigationRef.isReady()) {
    const { name, params } = pendingNav;
    pendingNav = null;
    navigationRef.navigate(name, params);
  }
}

export function replace(name, params) {
  if (navigationRef.isReady()) {
    navigationRef.dispatch({
      type: 'REPLACE',
      payload: { name, params },
    });
  }
}

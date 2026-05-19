jest.mock('react-native-config', () => ({
  PROD_API: 'https://api.example.com',
  AUTH_API_URL: 'https://auth.example.com',
  USE_AUTH_GATEWAY: 'true',
  WEB_APP_URL: 'https://www.liquidspirit.org',
  AWS_ACCESS_KEY_ID: 'test-access-key',
  AWS_SECRET_ACCESS_KEY: 'test-secret-key',
  AWS_REGION: 'ap-southeast-2',
}));

jest.mock('./navigation/RootNavigation', () => ({
  navigationRef: {
    isReady: jest.fn(() => true),
    navigate: jest.fn(),
    dispatch: jest.fn(),
  },
  navigate: jest.fn(),
  navigateWhenReady: jest.fn(),
  flushPendingNavigation: jest.fn(),
  replace: jest.fn(),
}));

jest.mock('react-native-fast-image', () => {
  const React = require('react');
  const { Image } = require('react-native');

  const FastImage = props => React.createElement(Image, props);
  FastImage.preload = jest.fn();
  FastImage.priority = {
    low: 'low',
    normal: 'normal',
    high: 'high',
  };
  FastImage.cacheControl = {
    immutable: 'immutable',
    web: 'web',
    cacheOnly: 'cacheOnly',
  };
  FastImage.resizeMode = {
    contain: 'contain',
    cover: 'cover',
    stretch: 'stretch',
    center: 'center',
  };

  return FastImage;
});

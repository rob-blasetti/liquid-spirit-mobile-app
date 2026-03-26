import Config from 'react-native-config';

const resolveBoolean = (value, fallback = false) => {
  if (typeof value !== 'string') {
    return fallback;
  }

  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
};

// Set primary API URL
export const API_URL = Config.PROD_API;

export const USE_AUTH_GATEWAY = resolveBoolean(Config.USE_AUTH_GATEWAY, true);

// New auth gateway API URL, with runtime switch to force legacy backend auth path.
export const AUTH_API_URL =
  USE_AUTH_GATEWAY && Boolean(Config.AUTH_API_URL)
    ? Config.AUTH_API_URL
    : API_URL;

export const MAPS_API_KEY = typeof Config.MAPS_API_KEY === 'string'
  ? Config.MAPS_API_KEY.trim()
  : '';

export const HAS_NATIVE_GOOGLE_MAPS = MAPS_API_KEY.length > 0;

// Removed debug log to prevent console output during tests
// console.log(API_URL);

export const PASSKEY_WEBSITE_PATH = '/settings/security';
export const WEB_APP_URL = Config.WEB_APP_URL || 'https://www.liquidspirit.org';

// Toggle password validation globally (set true to re-enable client checks)
export const ENABLE_PASSWORD_VALIDATION = false;

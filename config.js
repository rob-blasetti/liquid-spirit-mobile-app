import Config from 'react-native-config';

// Set primary API URL
export const API_URL = Config.PROD_API;

// New auth gateway API URL (defaults to primary API if not explicitly set)
export const AUTH_API_URL = Config.AUTH_API_URL || API_URL;

// Removed debug log to prevent console output during tests
// console.log(API_URL);

export const AWS_ID = Config.AWS_ACCESS_KEY_ID;
export const AWS_Secret = Config.AWS_SECRET_ACCESS_KEY;
export const AWS_Region = Config.AWS_REGION;

// Toggle password validation globally (set true to re-enable client checks)
export const ENABLE_PASSWORD_VALIDATION = false;

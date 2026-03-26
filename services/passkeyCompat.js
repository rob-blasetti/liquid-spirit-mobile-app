import { Platform } from 'react-native';

const unsupportedPasskey = {
  async isSupported() {
    return false;
  },
  async create() {
    throw new Error('Native passkeys are unavailable on Android in this build.');
  },
  async createPlatformKey() {
    throw new Error('Native passkeys are unavailable on Android in this build.');
  },
  async createSecurityKey() {
    throw new Error('Native passkeys are unavailable on Android in this build.');
  },
  async get() {
    throw new Error('Native passkeys are unavailable on Android in this build.');
  },
  async getPlatformKey() {
    throw new Error('Native passkeys are unavailable on Android in this build.');
  },
  async getSecurityKey() {
    throw new Error('Native passkeys are unavailable on Android in this build.');
  },
};

export const Passkey =
  Platform.OS === 'ios' ? require('react-native-passkey').Passkey : unsupportedPasskey;

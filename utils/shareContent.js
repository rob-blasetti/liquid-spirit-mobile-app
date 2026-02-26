import { Alert, Linking, Share } from 'react-native';

const deepLinkBuilders = {
  whatsapp: ({ message }) =>
    message ? `whatsapp://send?text=${encodeURIComponent(message)}` : null,
  messenger: ({ url }) => (url ? `fb-messenger://share?link=${encodeURIComponent(url)}` : null),
};

const tryOpenDeepLink = async (url) => {
  if (!url) return false;
  try {
    const supported = await Linking.canOpenURL(url);
    if (!supported) return false;
    await Linking.openURL(url);
    return true;
  } catch (error) {
    if (__DEV__) {
      console.warn('[shareContent] Deep link failed', url, error);
    }
    return false;
  }
};

export const shareContent = async ({
  message,
  url,
  title = 'Share',
  preferApps = ['whatsapp', 'messenger'],
  alertTitle = 'Sharing Error',
  alertMessage = 'Something went wrong while trying to share.',
  onShareError,
  shareOptions,
} = {}) => {
  const payload = {
    message: message || url || '',
    url: url || '',
  };

  for (const app of preferApps) {
    const builder = deepLinkBuilders[app];
    if (!builder) continue;
    const deepLink = builder(payload);
    if (await tryOpenDeepLink(deepLink)) {
      return;
    }
  }

  try {
    const sharePayload = { message: payload.message };
    // Avoid passing both `message` and `url` when message already includes the link.
    // Some targets append an encoded URL payload (e.g. bplist artifacts) in that case.
    if (!payload.message && payload.url) {
      sharePayload.url = payload.url;
    }
    if (title) {
      sharePayload.title = title;
    }
    await Share.share(sharePayload, shareOptions);
  } catch (error) {
    console.error('[shareContent] Share failed:', error);
    if (typeof onShareError === 'function') {
      onShareError(error);
      return;
    }
    Alert.alert(alertTitle, alertMessage);
  }
};

import { useCallback } from 'react';
import { Linking } from 'react-native';

const normalizeString = (value) => (typeof value === 'string' ? value.trim() : '');

export const buildGoogleMapsUrl = (query) => {
  const cleaned = normalizeString(query);
  if (!cleaned) return '';
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleaned)}`;
};

const useGoogleMaps = () => {
  const openGoogleMaps = useCallback((query) => {
    const url = buildGoogleMapsUrl(query);
    if (!url) return;
    Linking.openURL(url).catch((err) => {
      console.warn('Failed to open maps', err);
    });
  }, []);

  return { openGoogleMaps };
};

export default useGoogleMaps;

import FastImage from 'react-native-fast-image';
import { API_URL } from '../config';
import localImages from './localImages';

const PRIORITY_MAP = {
  low: FastImage.priority.low,
  normal: FastImage.priority.normal,
  high: FastImage.priority.high,
};

const CACHE_MAP = {
  immutable: FastImage.cacheControl.immutable,
  web: FastImage.cacheControl.web,
  cacheOnly: FastImage.cacheControl.cacheOnly,
};

const ABSOLUTE_URI_PATTERN = /^(?:https?:|file:|content:|data:|asset:|ph:)/i;

const normalizePriority = (priority) => {
  if (!priority) return FastImage.priority.normal;
  if (typeof priority === 'string') {
    return PRIORITY_MAP[priority] || FastImage.priority.normal;
  }
  return priority;
};

const normalizeCache = (cache) => {
  if (!cache) return FastImage.cacheControl.immutable;
  if (typeof cache === 'string') {
    return CACHE_MAP[cache] || FastImage.cacheControl.immutable;
  }
  return cache;
};

const normalizeUri = (uri, baseUrl) => {
  if (!uri || typeof uri !== 'string') return uri;
  if (ABSOLUTE_URI_PATTERN.test(uri)) return uri;
  const trimmedBase = (baseUrl || API_URL || '').replace(/\/$/, '');
  const sanitizedPath = uri.startsWith('/') ? uri.slice(1) : uri;
  return trimmedBase ? `${trimmedBase}/${sanitizedPath}` : sanitizedPath;
};

const buildSource = (raw, options) => {
  if (!raw) return null;

  if (typeof raw === 'number') {
    return raw;
  }

  const { baseUrl, priority, cache, headers } = options;

  if (typeof raw === 'object' && !Array.isArray(raw)) {
    if (raw.uri) {
      return {
        ...raw,
        uri: normalizeUri(raw.uri, baseUrl),
        priority: normalizePriority(raw.priority || priority),
        cache: normalizeCache(raw.cache || cache),
        ...(headers ? { headers: { ...headers, ...(raw.headers || {}) } } : {}),
      };
    }
    return raw;
  }

  if (localImages[raw]) {
    return localImages[raw];
  }

  const uri = normalizeUri(String(raw), baseUrl);
  const result = {
    uri,
    priority: normalizePriority(priority),
    cache: normalizeCache(cache),
  };

  if (headers) {
    result.headers = headers;
  }

  return result;
};

export const resolveImageSource = (input, options = {}) => {
  const { fallback } = options;
  const source = buildSource(input, options);
  if (source) return source;
  if (fallback !== undefined) {
    return buildSource(fallback, options);
  }
  return null;
};

export const prefetchImageSources = (inputs, options = {}) => {
  if (!Array.isArray(inputs) || inputs.length === 0) return;
  const sources = inputs
    .map(item => resolveImageSource(item, options))
    .filter(src => src && typeof src === 'object' && !!src.uri);
  if (!sources.length) return;
  FastImage.preload(sources);
};

export const isRemoteImage = (value) => {
  if (!value) return false;
  if (typeof value === 'string') {
    return ABSOLUTE_URI_PATTERN.test(value) || value.startsWith('http');
  }
  if (typeof value === 'object' && value.uri) {
    return ABSOLUTE_URI_PATTERN.test(value.uri) || value.uri.startsWith('http');
  }
  return false;
};

export default resolveImageSource;

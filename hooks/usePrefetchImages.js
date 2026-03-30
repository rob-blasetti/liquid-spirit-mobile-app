import { useEffect, useRef } from 'react';
import { prefetchImageSources } from '../utils/imageSource';

const buildKey = (items) => {
  return items
    .map(item => {
      if (!item) return 'null';
      if (typeof item === 'string') return item;
      if (typeof item === 'number') return `local:${item}`;
      if (typeof item === 'object' && item.uri) return item.uri;
      return JSON.stringify(item);
    })
    .join('|');
};

const usePrefetchImages = (sources, options = {}) => {
  const lastKeyRef = useRef(null);
  const {
    baseUrl,
    cache,
    priority,
    headers,
  } = options;

  useEffect(() => {
    if (!sources) return;
    const list = Array.isArray(sources) ? sources.filter(Boolean) : [sources];
    if (!list.length) return;

    const currentKey = buildKey(list);
    if (currentKey === lastKeyRef.current) return;
    lastKeyRef.current = currentKey;

    prefetchImageSources(list, { baseUrl, cache, priority, headers });
  }, [sources, baseUrl, cache, priority, headers]);
};

export default usePrefetchImages;

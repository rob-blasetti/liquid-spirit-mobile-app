import { API_URL } from '../config';

// Resolve a displayable media URL for a post's first media item
export function resolveMediaUrl(post) {
  try {
    const media = Array.isArray(post?.media) ? post.media : [];
    const first = media[0] ?? null;

    let candidate = null;
    if (typeof first === 'string') {
      candidate = first;
    } else if (first && typeof first === 'object') {
      candidate = first.url || first.secure_url || first.originalUrl || first.thumbnailUrl || first.src || null;
    }

    if (!candidate || typeof candidate !== 'string') return null;

    // Normalize and prefix if needed
    const trimmed = candidate.trim();
    if (/^https?:\/\//i.test(trimmed)) return trimmed;

    // Handle leading slashes and join with API_URL
    const base = String(API_URL || '').replace(/\/$/, '');
    const path = trimmed.replace(/^\//, '');
    return `${base}/${path}`;
  } catch (_) {
    return null;
  }
}


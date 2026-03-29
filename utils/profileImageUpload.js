const HEIC_MIME_TYPES = new Set([
  'image/heic',
  'image/heic-sequence',
  'image/heif',
  'image/heif-sequence',
]);

const HEIC_FILE_EXTENSION_PATTERN = /\.(heic|heif)$/i;

const MIME_EXTENSION_MAP = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
};

const inferExtensionFromPath = value => {
  const match = String(value || '').match(/\.([a-zA-Z0-9]+)(?:$|[?#])/);
  return match ? match[1].toLowerCase() : '';
};

export const isHeicLikeImage = ({ fileName, type, uri } = {}) => {
  const normalizedType = String(type || '').trim().toLowerCase();
  if (HEIC_MIME_TYPES.has(normalizedType)) return true;

  const extension = inferExtensionFromPath(fileName) || inferExtensionFromPath(uri);
  return extension === 'heic' || extension === 'heif';
};

export const buildUploadFileName = (fileName, contentType) => {
  const trimmedName = String(fileName || '').trim();
  const baseName = trimmedName
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || `profile-${Date.now()}`;

  const normalizedType = String(contentType || '').trim().toLowerCase();
  const mappedExtension = MIME_EXTENSION_MAP[normalizedType];

  if (mappedExtension) {
    return `${baseName}.${mappedExtension}`;
  }

  const originalExtension = inferExtensionFromPath(trimmedName);
  const fallbackExtension = originalExtension || 'jpg';
  return `${baseName}.${fallbackExtension}`;
};

export const resolveProfileImageUploadAsset = ({ asset, blob }) => {
  const blobType = String(blob?.type || '').trim().toLowerCase();
  const assetType = String(asset?.type || '').trim().toLowerCase();
  const contentType = blobType || assetType || 'image/jpeg';

  if (isHeicLikeImage(asset) && HEIC_MIME_TYPES.has(contentType)) {
    throw new Error('This HEIC image could not be converted to a compatible upload format.');
  }

  return {
    contentType,
    fileName: buildUploadFileName(asset?.fileName, contentType),
  };
};

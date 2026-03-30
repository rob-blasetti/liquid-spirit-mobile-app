const MIME_EXTENSION_MAP = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'image/heic-sequence': 'heic',
  'image/heif-sequence': 'heif',
};

const inferExtensionFromPath = value => {
  const match = String(value || '').match(/\.([a-zA-Z0-9]+)(?:$|[?#])/);
  return match ? match[1].toLowerCase() : '';
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

export const resolveProfileImageUploadAsset = asset => {
  const uri = String(asset?.uri || '').trim();
  if (!uri) {
    throw new Error('No valid image URI found.');
  }

  const contentType = String(asset?.type || '').trim().toLowerCase() || 'image/jpeg';

  return {
    uri,
    type: contentType,
    name: buildUploadFileName(asset?.fileName, contentType),
  };
};

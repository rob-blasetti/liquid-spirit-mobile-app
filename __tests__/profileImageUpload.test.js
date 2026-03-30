import {
  buildUploadFileName,
  resolveProfileImageUploadAsset,
} from '../utils/profileImageUpload';

describe('profileImageUpload', () => {
  it('preserves HEIC uploads for backend normalization', () => {
    expect(
      resolveProfileImageUploadAsset({
        uri: 'file:///tmp/avatar.heic',
        fileName: 'avatar.heic',
        type: 'image/heic',
      }),
    ).toEqual({
      uri: 'file:///tmp/avatar.heic',
      type: 'image/heic',
      name: 'avatar.heic',
    });
  });

  it('renames converted jpeg uploads to jpg', () => {
    expect(buildUploadFileName('My Pic.heic', 'image/jpeg')).toBe('My-Pic.jpg');
  });

  it('builds a safe multipart payload from the selected asset', () => {
    expect(
      resolveProfileImageUploadAsset({
        uri: 'content://photos/avatar.jpeg',
        fileName: 'My Photo.jpeg',
        type: 'image/jpeg',
      }),
    ).toEqual({
      uri: 'content://photos/avatar.jpeg',
      type: 'image/jpeg',
      name: 'My-Photo.jpg',
    });
  });

  it('falls back to the original extension when the mime type is missing', () => {
    expect(buildUploadFileName('portrait.heif', '')).toBe('portrait.heif');
  });

  it('throws when the selected asset has no uri', () => {
    expect(() =>
      resolveProfileImageUploadAsset({
        fileName: 'avatar.heic',
        type: 'image/heic',
      }),
    ).toThrow('No valid image URI found.');
  });
});

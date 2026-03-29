import {
  buildUploadFileName,
  isHeicLikeImage,
  resolveProfileImageUploadAsset,
} from '../utils/profileImageUpload';

describe('profileImageUpload', () => {
  it('detects HEIC images by mime type', () => {
    expect(isHeicLikeImage({ type: 'image/heic', fileName: 'avatar.jpg' })).toBe(true);
  });

  it('detects HEIF images by file extension', () => {
    expect(isHeicLikeImage({ fileName: 'avatar.HEIF', type: '' })).toBe(true);
  });

  it('renames converted jpeg uploads to jpg', () => {
    expect(buildUploadFileName('My Pic.heic', 'image/jpeg')).toBe('My-Pic.jpg');
  });

  it('prefers the fetched blob mime type when building the upload payload', () => {
    expect(
      resolveProfileImageUploadAsset({
        asset: { fileName: 'avatar.heic', type: 'image/heic' },
        blob: { type: 'image/jpeg' },
      }),
    ).toEqual({
      contentType: 'image/jpeg',
      fileName: 'avatar.jpg',
    });
  });

  it('rejects HEIC assets that remain HEIC after selection', () => {
    expect(() =>
      resolveProfileImageUploadAsset({
        asset: { fileName: 'avatar.heic', type: 'image/heic' },
        blob: { type: 'image/heic' },
      }),
    ).toThrow('This HEIC image could not be converted to a compatible upload format.');
  });
});

import { resolveMediaUrl } from '../utils/resolveMediaUrl';

jest.mock('../config', () => ({
  API_URL: 'https://api.example.com/',
}));

describe('resolveMediaUrl', () => {
  it('returns absolute URLs unchanged when the first media item is a string', () => {
    const post = { media: ['https://cdn.example.com/assets/image.jpg'] };

    expect(resolveMediaUrl(post)).toBe('https://cdn.example.com/assets/image.jpg');
  });

  it('prefers the first matching URL-like property on media objects', () => {
    const post = {
      media: [
        {
          secure_url: 'https://secure.example.com/photo.png',
          originalUrl: 'https://fallback.example.com/photo.png',
        },
      ],
    };

    expect(resolveMediaUrl(post)).toBe('https://secure.example.com/photo.png');
  });

  it('falls back through known properties to resolve a relative path', () => {
    const post = {
      media: [
        {
          thumbnailUrl: '/uploads/gallery/item.jpg',
        },
      ],
    };

    expect(resolveMediaUrl(post)).toBe('https://api.example.com/uploads/gallery/item.jpg');
  });

  it('trims surrounding whitespace before resolving a relative path', () => {
    const post = { media: [{ url: ' media/item-two.jpg ' }] };

    expect(resolveMediaUrl(post)).toBe('https://api.example.com/media/item-two.jpg');
  });

  it('returns null when the media array does not contain a usable value', () => {
    const post = { media: [123] };

    expect(resolveMediaUrl(post)).toBeNull();
  });

  it('gracefully handles unexpected access errors', () => {
    const post = Object.defineProperty({}, 'media', {
      get() {
        throw new Error('nope');
      },
    });

    expect(resolveMediaUrl(post)).toBeNull();
  });
});

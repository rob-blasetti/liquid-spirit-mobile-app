import { Buffer } from 'buffer';
import { isJwtExpired, resolveAccessToken, resolveRefreshToken } from '../utils/authTokens';

const toBase64Url = value => {
  const base64 = Buffer.from(JSON.stringify(value)).toString('base64');
  return base64.replaceAll('=', '').replaceAll('+', '-').replaceAll('/', '_');
};

const buildTokenWithExp = exp => {
  const header = toBase64Url({ alg: 'HS256', typ: 'JWT' });
  const payload = toBase64Url({ exp });
  return `${header}.${payload}.signature`;
};

describe('authTokens utils', () => {
  test('resolveAccessToken supports top-level and nested payload shapes', () => {
    expect(resolveAccessToken({ accessToken: 'top' })).toBe('top');
    expect(resolveAccessToken({ data: { token: 'nested' } })).toBe('nested');
    expect(resolveAccessToken({})).toBeNull();
  });

  test('resolveRefreshToken supports top-level and nested payload shapes', () => {
    expect(resolveRefreshToken({ refreshToken: 'top' })).toBe('top');
    expect(resolveRefreshToken({ data: { newRefreshToken: 'nested' } })).toBe('nested');
    expect(resolveRefreshToken({})).toBeNull();
  });

  test('isJwtExpired returns true for expired or invalid tokens', () => {
    const expired = buildTokenWithExp(Math.floor(Date.now() / 1000) - 60);
    const valid = buildTokenWithExp(Math.floor(Date.now() / 1000) + 3600);

    expect(isJwtExpired(expired)).toBe(true);
    expect(isJwtExpired(valid)).toBe(false);
    expect(isJwtExpired('not-a-token')).toBe(true);
    expect(isJwtExpired(null)).toBe(true);
  });
});

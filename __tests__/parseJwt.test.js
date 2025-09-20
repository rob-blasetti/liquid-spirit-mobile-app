import { parseJwt } from '../utils/parseJwt';

describe('parseJwt', () => {
  it('parses a valid JWT payload', () => {
    const payload = { sub: '123', role: 'admin', exp: 1_700_000_000 };
    const base64Payload = Buffer.from(JSON.stringify(payload))
      .toString('base64')
      .replace(/=+$/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
    const token = `aaa.${base64Payload}.bbb`;

    expect(parseJwt(token)).toEqual(payload);
  });

  it('throws when no token is provided', () => {
    expect(() => parseJwt()).toThrow('No token provided');
  });

  it('throws when the token structure is invalid', () => {
    expect(() => parseJwt('only.two')).toThrow('Token is not a valid JWT');
  });

  it('wraps decoding issues in a descriptive error', () => {
    const token = 'aaa.@@@.bbb';

    expect(() => parseJwt(token)).toThrow(/Error decoding token payload/);
  });
});

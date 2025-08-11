jest.mock('react-native-config', () => ({ PROD_API: 'https://api.test' }));

let getPushPreferences, updatePushPreferences, normalizePreferences;
beforeAll(() => {
  ({ getPushPreferences, updatePushPreferences, normalizePreferences } = require('../services/PushPreferencesService'));
});

describe('PushPreferencesService', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('getPushPreferences hits dashed then camel on 404', async () => {
    fetch
      .mockResolvedValueOnce({ ok: false, status: 404, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ data: { post_created: true } }) });

    const prefs = await getPushPreferences('auth', 'user123');
    expect(fetch).toHaveBeenNthCalledWith(1, 'https://api.test/api/users/user123/push-preferences', expect.any(Object));
    expect(fetch).toHaveBeenNthCalledWith(2, 'https://api.test/api/users/user123/pushPreferences', expect.any(Object));
    expect(prefs.post_created).toBe(true);
  });

  test('updatePushPreferences sends PUT with patch body', async () => {
    fetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ preferences: { post_media: false } }) });

    const patch = { post_media: false };
    const prefs = await updatePushPreferences('auth', 'u1', patch);
    expect(fetch).toHaveBeenCalledWith(
      'https://api.test/api/users/u1/push-preferences',
      expect.objectContaining({ method: 'PUT' })
    );
    const options = fetch.mock.calls[0][1];
    expect(JSON.parse(options.body)).toEqual(patch);
    expect(prefs.post_media).toBe(false);
  });

  test('normalizePreferences defaults missing keys to true', () => {
    const norm = normalizePreferences({ post_media: false });
    expect(norm.post_media).toBe(false);
    // a known key not present should be true by default
    expect(norm.post_created).toBe(true);
  });
});


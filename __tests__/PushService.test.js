jest.mock('react-native-config', () => ({ PROD_API: 'https://api.test' }));
jest.mock('../navigation/RootNavigation', () => ({ navigate: jest.fn() }));

// Defer requiring the module until after mocks are set up
let getApnsHealth, registerDevice, sendTestPush;
beforeAll(() => {
  ({ getApnsHealth, registerDevice, sendTestPush } = require('../services/PushService'));
});

describe('PushService helpers', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('getApnsHealth builds correct URL (config only)', async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true }), status: 200 });
    const res = await getApnsHealth('auth-token', { connectivity: false });
    expect(fetch).toHaveBeenCalledWith('https://api.test/api/push/health', expect.any(Object));
    expect(res.ok).toBe(true);
  });

  test('getApnsHealth builds correct URL (connectivity)', async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ connectivity: { ok: true } }), status: 200 });
    const res = await getApnsHealth('auth-token', { connectivity: true });
    expect(fetch).toHaveBeenCalledWith('https://api.test/api/push/health?connectivity=true', expect.any(Object));
    expect(res.ok).toBe(true);
  });

  test('registerDevice tries dashed then camel on 404', async () => {
    fetch
      .mockResolvedValueOnce({ ok: false, status: 404, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ saved: true }) });

    const res = await registerDevice('auth-token', 'a'.repeat(64));
    expect(fetch).toHaveBeenNthCalledWith(
      1,
      'https://api.test/api/push/register-device',
      expect.objectContaining({ method: 'POST' })
    );
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      'https://api.test/api/push/registerDevice',
      expect.objectContaining({ method: 'POST' })
    );
    expect(res.ok).toBe(true);
  });

  test('sendTestPush posts expected body', async () => {
    const token = 't'.repeat(64);
    fetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ accepted: true }) });
    const res = await sendTestPush('auth', token, { title: 'T', body: 'B', payload: { debug: true } });
    expect(fetch).toHaveBeenCalledWith(
      'https://api.test/api/push/send',
      expect.objectContaining({ method: 'POST' })
    );
    const options = fetch.mock.calls[0][1];
    const parsed = JSON.parse(options.body);
    expect(parsed.token).toBe(token);
    expect(parsed.alert).toEqual({ title: 'T', body: 'B' });
    expect(parsed.payload).toEqual({ debug: true });
    expect(res.ok).toBe(true);
  });
});

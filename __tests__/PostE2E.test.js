// @jest-environment node
// End-to-end test for posting image/video and verifying on social media feed.
// Mock react-native-config to point API_URL to local development backend
jest.mock('react-native-config', () => ({
  DEV_API: process.env.DEV_API || 'http://localhost:5005',
  STAGING_API: process.env.STAGING_API || 'https://liquid-spirit-backend-staging-2a7049350332.herokuapp.com',
  PROD_API: process.env.DEV_API || 'http://localhost:5005',
  AWS_ACCESS_KEY_ID: '',
  AWS_SECRET_ACCESS_KEY: '',
  AWS_REGION: '',
}));

import { API_URL } from '../config';
import * as PostService from '../services/PostService';
import NotificationService from '../services/NotificationService';

// Increase timeout for async operations
jest.setTimeout(60000);

const buildJsonResponse = (data, { ok = true, status = 200 } = {}) => ({
  ok,
  status,
  json: async () => data,
});

describe('End-to-end Post and Feed Integration', () => {
  let token;
  let user;
  let communityId;
  // Hold created posts for cleanup
  let createdImagePost;
  let createdVideoPost;
  const posts = [];
  const notifications = [];

  const mockFetchImplementation = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input.url;
    const { method = 'GET', headers = {}, body } = init;
    const { pathname, searchParams } = new URL(url);

    if (pathname === '/api/auth/login' && method === 'POST') {
      return buildJsonResponse({ token: 'test-token' });
    }

    if (pathname === '/api/auth/me' && method === 'GET') {
      return buildJsonResponse({
        data: {
          user: {
            _id: 'user-123',
            community: 'community-456',
          },
        },
      });
    }

    if (pathname === '/api/posts/create' && method === 'POST') {
      if (!headers.Authorization) {
        return buildJsonResponse({ message: 'Missing auth header' }, { ok: false, status: 401 });
      }

      const payload = JSON.parse(body);
      const newPost = {
        _id: `post-${posts.length + 1}`,
        media: payload.media,
        content: payload.content,
      };
      posts.push(newPost);
      notifications.push({
        _id: `notif-${notifications.length + 1}`,
        target: newPost._id,
      });
      return buildJsonResponse({ data: newPost });
    }

    if (pathname === '/api/posts/explore-feed' && method === 'GET') {
      if (!headers.Authorization) {
        return buildJsonResponse({ message: 'Missing auth header' }, { ok: false, status: 401 });
      }

      return buildJsonResponse({ data: posts });
    }

    if (pathname.startsWith('/api/posts/') && method === 'DELETE') {
      const postId = pathname.split('/').pop();
      const index = posts.findIndex(p => p._id === postId);
      if (index >= 0) {
        posts.splice(index, 1);
      }
      return buildJsonResponse({ success: true });
    }

    if (pathname === '/api/notifications' && method === 'GET') {
      if (!headers.Authorization) {
        return buildJsonResponse({ message: 'Missing auth header' }, { ok: false, status: 401 });
      }

      const limit = searchParams.get('limit');
      const offset = Number(searchParams.get('offset') || 0);
      const sliceEnd = limit ? offset + Number(limit) : undefined;
      return buildJsonResponse({ data: notifications.slice(offset, sliceEnd) });
    }

    if (pathname.startsWith('/api/notifications/') && method === 'DELETE') {
      const notificationId = pathname.split('/').pop();
      const index = notifications.findIndex(n => n._id === notificationId);
      if (index >= 0) {
        notifications.splice(index, 1);
      }
      return buildJsonResponse({ success: true });
    }

    throw new Error(`Unhandled fetch request: ${method} ${url}`);
  };

  beforeAll(async () => {
    jest.spyOn(global, 'fetch').mockImplementation(mockFetchImplementation);

    // Require test credentials via environment variables
    const email = process.env.TEST_EMAIL ?? 'test@example.com';
    const password = process.env.TEST_PASSWORD ?? 'password123';
    if (!email || !password) {
      throw new Error('Please set TEST_EMAIL and TEST_PASSWORD environment variables for E2E test.');
    }
    // Perform login to retrieve token
    const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    expect(loginResponse.ok).toBe(true);
    const loginData = await loginResponse.json();
    // Extract token from response
    token = loginData.token || loginData.data?.token || loginData.data?.accessToken;
    if (!token) throw new Error('Login response did not return a token.');
    // Fetch current user details
    const meResponse = await fetch(`${API_URL}/api/auth/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    expect(meResponse.ok).toBe(true);
    const meData = await meResponse.json();
    // Extract userId and communityId for createPost
    // Support various response shapes: wrapped in data.user, data, user, or top-level
    const rawUser = meData.data?.user || meData.data || meData.user || meData;
    const userId = rawUser._id || rawUser.id;
    if (!userId) throw new Error('Unable to extract user ID from /me response.');
    user = { id: userId };
    communityId = rawUser.community?._id || rawUser.community;
    if (!communityId) throw new Error('User does not have an associated community ID.');
  });

  it('should create an image post and verify it appears in the explore feed', async () => {
    const title = `E2E Image Post ${Date.now()}`;
    const content = 'E2E Test: image post';
    // Use a publicly available image URL for testing
    const mediaUrl = 'https://placekitten.com/400/300';
    const mediaThumbnailUrl = 'https://placekitten.com/100/75';
    const created = await PostService.createPost({
      title,
      content,
      mediaUrl,
      mediaThumbnailUrl,
      user,
      userCommunityId: communityId,
      token,
    });
    expect(created).toBeDefined();
    expect(created._id).toBeDefined();
    // Fetch the explore feed and verify the new post is present
    const feed = await PostService.fetchExploreFeed(token);
    const found = feed.find(p => p._id === created._id);
    expect(found).toBeDefined();
    expect(found.media).toContain(mediaUrl);
    // retain for cleanup
    createdImagePost = created;
  });

  it('should create a video post and verify it appears in the explore feed', async () => {
    const title = `E2E Video Post ${Date.now()}`;
    const content = 'E2E Test: video post';
    // Use existing test video URL and thumbnail
    const mediaUrl = 'https://liquid-spirit.s3.us-east-1.amazonaws.com/test-video.mp4';
    const mediaThumbnailUrl = 'https://placekitten.com/200/150';
    const created = await PostService.createPost({
      title,
      content,
      mediaUrl,
      mediaThumbnailUrl,
      user,
      userCommunityId: communityId,
      token,
    });
    expect(created).toBeDefined();
    expect(created._id).toBeDefined();
    const feed = await PostService.fetchExploreFeed(token);
    const found = feed.find(p => p._id === created._id);
    expect(found).toBeDefined();
    expect(found.media).toContain(mediaUrl);
    // retain for cleanup
    createdVideoPost = created;
  });

  // Cleanup created posts and related notifications
  afterAll(async () => {
    // Delete posts
    if (createdImagePost && createdImagePost._id) {
      await PostService.deletePost(createdImagePost._id, token);
    }
    if (createdVideoPost && createdVideoPost._id) {
      await PostService.deletePost(createdVideoPost._id, token);
    }
    // Delete related notifications
    try {
      const notifRes = await NotificationService.getAllNotifications(token, { limit: 100, offset: 0 });
      const fetchedNotifications = notifRes.data || notifRes;
      const related = (fetchedNotifications || []).filter(n => {
        const tgt = n.target && typeof n.target === 'object' ? n.target._id : n.target;
        return tgt === createdImagePost?._id || tgt === createdVideoPost?._id;
      });
      for (const n of related) {
        await fetch(`${API_URL}/api/notifications/${n._id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (err) {
      console.error('Cleanup notifications failed:', err);
    }

    jest.restoreAllMocks();
  });
});

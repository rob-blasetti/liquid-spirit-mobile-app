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

// Increase timeout for network interactions
jest.setTimeout(60000);

// Skipping end-to-end tests in CI environment
describe.skip('End-to-end Post and Feed Integration', () => {
  let token;
  let user;
  let communityId;
  // Hold created posts for cleanup
  let createdImagePost;
  let createdVideoPost;

  beforeAll(async () => {
    // Require test credentials via environment variables
    const email = process.env.TEST_EMAIL;
    const password = process.env.TEST_PASSWORD;
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
    const feed = await PostService.fetchExploreFeed();
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
    const feed = await PostService.fetchExploreFeed();
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
      const notifications = notifRes.data || notifRes;
      const related = (notifications || []).filter(n => {
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
  });
});
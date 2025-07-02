import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import SocialMedia from '../screens/SocialMedia';
import { UserContext } from '../contexts/UserContext';
import * as PostService from '../services/PostService';
// Mock the Post component to avoid internal implementation details
jest.mock('../components/Post', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return ({ post }) => (
    React.createElement(View, null,
      React.createElement(Text, { testID: 'post-content' }, post.content),
      React.createElement(Text, { testID: 'post-media' }, post.media[0])
    )
  );
});

// Mock PostService methods
jest.mock('../services/PostService', () => ({
  fetchExploreFeed: jest.fn(),
  fetchForYouFeed: jest.fn(),
  // other service functions if needed
  likePost: jest.fn(),
  commentOnPost: jest.fn(),
  flagPost: jest.fn(),
  deletePost: jest.fn(),
}));
// Mock modals to avoid importing navigation and screens dependencies
jest.mock('../modal/WelcomeModal', () => () => null);
jest.mock('../modal/CommentModal', () => () => null);

describe('SocialMedia screen', () => {
  const userContextValue = {
    token: 'token123',
    communityId: 'community123',
    isTokenExpired: () => false,
    refreshSession: jest.fn(),
    user: { id: 'user123' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders image posts after fetching explore feed', async () => {
    const dummyMediaUrl = 'https://example.com/image.jpg';
    const dummyPost = {
      _id: 'post1',
      media: [dummyMediaUrl],
      content: 'Image post content',
      author: { firstName: 'John', lastName: 'Doe', _id: 'user123', profilePicture: 'https://example.com/profile.jpg' },
      community: { name: 'TestCommunity' },
      likes: [],
      comments: [],
    };
    PostService.fetchExploreFeed.mockResolvedValue([dummyPost]);
    PostService.fetchForYouFeed.mockResolvedValue([]);

    const { getByTestId } = render(
      <UserContext.Provider value={userContextValue}>
        <SocialMedia />
      </UserContext.Provider>
    );

    // Wait for explore feed to load
    await waitFor(() => expect(PostService.fetchExploreFeed).toHaveBeenCalled());

    // The post content and media URL are rendered by the mocked Post component
    expect(getByTestId('post-content').props.children).toBe('Image post content');
    expect(getByTestId('post-media').props.children).toBe(dummyMediaUrl);
  });

  it('renders video posts after fetching explore feed', async () => {
    const dummyMediaUrl = 'https://example.com/video.mp4';
    const dummyPost = {
      _id: 'post2',
      media: [dummyMediaUrl],
      content: 'Video post content',
      author: { firstName: 'Jane', lastName: 'Smith', _id: 'user123', profilePicture: 'https://example.com/profile2.jpg' },
      community: { name: 'TestCommunity' },
      likes: [],
      comments: [],
    };
    PostService.fetchExploreFeed.mockResolvedValue([dummyPost]);
    PostService.fetchForYouFeed.mockResolvedValue([]);

    const { getByTestId } = render(
      <UserContext.Provider value={userContextValue}>
        <SocialMedia />
      </UserContext.Provider>
    );

    // Wait for explore feed to load
    await waitFor(() => expect(PostService.fetchExploreFeed).toHaveBeenCalled());

    // The post content and media URL are rendered by the mocked Post component
    expect(getByTestId('post-content').props.children).toBe('Video post content');
    expect(getByTestId('post-media').props.children).toBe(dummyMediaUrl);
  });
});
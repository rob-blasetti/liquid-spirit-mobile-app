import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import CreatePost from '../screens/CreatePost';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { uploadImageWithThumbnail, uploadVideoWithThumbnail, createPost } from '../services/PostService';
import { UserContext } from '../contexts/UserContext';

jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(),
  launchCamera: jest.fn(),
}));

jest.mock('../services/PostService', () => ({
  uploadImageWithThumbnail: jest.fn(),
  uploadVideoWithThumbnail: jest.fn(),
  createPost: jest.fn(),
}));

describe('CreatePost screen', () => {
  const userContextValue = {
    communityId: 'community123',
    token: 'token123',
    user: { id: 'user123' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays image preview when selecting JPEG image', async () => {
    const dummyAsset = { uri: 'file://image.jpg', type: 'image/jpeg' };
    launchImageLibrary.mockImplementation((options, callback) => {
      callback({ assets: [dummyAsset] });
    });

    const { getByText, getByTestId, queryByTestId } = render(
      <UserContext.Provider value={userContextValue}>
        <CreatePost />
      </UserContext.Provider>
    );

    fireEvent.press(getByText('Gallery'));
    await waitFor(() => {
      expect(getByTestId('imagePreview')).toBeTruthy();
      expect(queryByTestId('videoPreview')).toBeNull();
    });
  });

  it('displays image preview when selecting PNG image', async () => {
    const dummyAsset = { uri: 'file://image.png', type: 'image/png' };
    launchImageLibrary.mockImplementation((options, callback) => {
      callback({ assets: [dummyAsset] });
    });

    const { getByText, getByTestId, queryByTestId } = render(
      <UserContext.Provider value={userContextValue}>
        <CreatePost />
      </UserContext.Provider>
    );

    fireEvent.press(getByText('Gallery'));
    await waitFor(() => {
      expect(getByTestId('imagePreview')).toBeTruthy();
      expect(queryByTestId('videoPreview')).toBeNull();
    });
  });

  it('displays image preview when selecting WEBP image', async () => {
    const dummyAsset = { uri: 'file://image.webp', type: 'image/webp' };
    launchImageLibrary.mockImplementation((options, callback) => {
      callback({ assets: [dummyAsset] });
    });

    const { getByText, getByTestId, queryByTestId } = render(
      <UserContext.Provider value={userContextValue}>
        <CreatePost />
      </UserContext.Provider>
    );

    fireEvent.press(getByText('Gallery'));
    await waitFor(() => {
      expect(getByTestId('imagePreview')).toBeTruthy();
      expect(queryByTestId('videoPreview')).toBeNull();
    });
  });

  it('displays video preview when selecting MP4 video', async () => {
    const dummyAsset = { uri: 'file://video.mp4', type: 'video/mp4' };
    launchImageLibrary.mockImplementation((options, callback) => {
      callback({ assets: [dummyAsset] });
    });

    const { getByText, getByTestId, queryByTestId } = render(
      <UserContext.Provider value={userContextValue}>
        <CreatePost />
      </UserContext.Provider>
    );

    fireEvent.press(getByText('Gallery'));
    await waitFor(() => {
      expect(getByTestId('videoPreview')).toBeTruthy();
      expect(queryByTestId('imagePreview')).toBeNull();
    });
  });

  it('displays video preview when selecting MOV video', async () => {
    const dummyAsset = { uri: 'file://video.mov', type: 'video/quicktime' };
    launchImageLibrary.mockImplementation((options, callback) => {
      callback({ assets: [dummyAsset] });
    });

    const { getByText, getByTestId, queryByTestId } = render(
      <UserContext.Provider value={userContextValue}>
        <CreatePost />
      </UserContext.Provider>
    );

    fireEvent.press(getByText('Gallery'));
    await waitFor(() => {
      expect(getByTestId('videoPreview')).toBeTruthy();
      expect(queryByTestId('imagePreview')).toBeNull();
    });
  });

  it('uploads image and creates post when pressing Post button', async () => {
    const dummyAsset = { uri: 'file://image.jpg', type: 'image/jpeg' };
    launchImageLibrary.mockImplementation((options, callback) => {
      callback({ assets: [dummyAsset] });
    });
    uploadImageWithThumbnail.mockResolvedValue({
      originalUrl: 'https://example.com/image.jpg',
      thumbnailUrl: 'https://example.com/thumb.jpg',
    });
    createPost.mockResolvedValue();

    const onPostCreated = jest.fn();
    const { getByText, getByPlaceholderText, getByTestId } = render(
      <UserContext.Provider value={userContextValue}>
        <CreatePost onPostCreated={onPostCreated} />
      </UserContext.Provider>
    );

    fireEvent.press(getByText('Gallery'));
    await waitFor(() => getByTestId('imagePreview'));

    fireEvent.changeText(
      getByPlaceholderText("What's on your mind?"),
      'Test post'
    );

    fireEvent.press(getByText('Post'));

    await waitFor(() => {
      expect(uploadImageWithThumbnail).toHaveBeenCalledWith(
        dummyAsset.uri,
        dummyAsset.type,
        userContextValue.token
      );
      expect(createPost).toHaveBeenCalledWith({
        title: '',
        content: 'Test post',
        mediaUrl: 'https://example.com/image.jpg',
        mediaThumbnailUrl: 'https://example.com/thumb.jpg',
        user: { id: userContextValue.user.id },
        userCommunityId: userContextValue.communityId,
        token: userContextValue.token,
      });
      expect(onPostCreated).toHaveBeenCalled();
    });
  });

  it('uploads video and creates post when pressing Post button', async () => {
    const dummyAsset = { uri: 'file://video.mp4', type: 'video/mp4' };
    launchImageLibrary.mockImplementation((options, callback) => {
      callback({ assets: [dummyAsset] });
    });
    uploadVideoWithThumbnail.mockResolvedValue({
      originalUrl: 'https://example.com/video.mp4',
      thumbnailUrl: 'https://example.com/thumb.jpg',
    });
    createPost.mockResolvedValue();

    const onPostCreated = jest.fn();
    const { getByText, getByPlaceholderText, getByTestId } = render(
      <UserContext.Provider value={userContextValue}>
        <CreatePost onPostCreated={onPostCreated} />
      </UserContext.Provider>
    );

    fireEvent.press(getByText('Gallery'));
    await waitFor(() => getByTestId('videoPreview'));

    fireEvent.changeText(
      getByPlaceholderText("What's on your mind?"),
      'Video post'
    );

    fireEvent.press(getByText('Post'));

    await waitFor(() => {
      expect(uploadVideoWithThumbnail).toHaveBeenCalledWith(
        dummyAsset.uri,
        dummyAsset.type,
        userContextValue.token
      );
      expect(createPost).toHaveBeenCalledWith({
        title: '',
        content: 'Video post',
        mediaUrl: 'https://example.com/video.mp4',
        mediaThumbnailUrl: 'https://example.com/thumb.jpg',
        user: { id: userContextValue.user.id },
        userCommunityId: userContextValue.communityId,
        token: userContextValue.token,
      });
      expect(onPostCreated).toHaveBeenCalled();
    });
  });
});
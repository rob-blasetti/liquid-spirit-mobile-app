import { API_URL } from '../config';
import { buildJsonHeaders, requestJson } from './http';
import debugLog from '../utils/debugLog';
// Note: UserContext/useContext not needed here

// Fetch the "Explore" feed; requires auth token
export const fetchExploreFeed = async (token) => {
  try {
    if (!token) {
      throw new Error('No authentication token provided for explore feed');
    }

    const { data: responseData } = await requestJson(
      `${API_URL}/api/posts/explore-feed`,
      {
        headers: buildJsonHeaders(token),
      },
      'Failed to fetch explore posts',
    );

    return responseData.data;
  } catch (error) {
    console.error('Error fetching explore feed:', error);
    throw new Error(`Fetch explore feed error: ${error.message}`);
  }
};

  // export const fetchForYouFeed = async (userCommunityId, token) => {
  //   try {
  //       const response = await fetch(`${API_URL}/api/posts/community-feed/${userCommunityId}`, {
  //         headers: {
  //           'Content-Type': 'application/json',
  //           'Authorization': `Bearer ${token}`,
  //         },
  //       });

  //       if (!response.ok) {
  //         throw new Error('Failed to fetch For You posts');
  //       }

  //       const responseData = await response.json();
  //       return responseData.data;
  //     } catch (error) {
  //       console.error('Error fetching For You (community feed):', error);
  //       throw new Error(`Fetch For You (community feed) error: ${error.message}`);
  //     }
  //   };


export const fetchForYouFeed = async () => [
  {
    _id: 'static-post',
    media: ['https://liquid-spirit.s3.us-east-1.amazonaws.com/profile-images/post-media-1741928527423.jpg'],
    content: 'A special post just for you!',
    author: {
      firstName: 'Coming',
      lastName: 'Soon',
      profilePicture: 'https://liquid-spirit.s3.us-east-1.amazonaws.com/profile-images/earth.png',
    },
    community: { name: 'Global Community' },
    likes: [],
    comments: [],
  },
];

export const fetchRecentCommunityPosts = async (userCommunityId, token) => {
  try {
    const { data: responseData } = await requestJson(
      `${API_URL}/api/posts/community-feed/${userCommunityId}`,
      {
        headers: buildJsonHeaders(token),
      },
      'Failed to fetch posts',
    );
    return responseData.data.slice(0, 5);
  } catch (error) {
    console.error('Error fetching recent posts:', error);
    throw new Error(`Fetch recent community posts error: ${error.message}`);
  }
};

export const fetchPostDetails = async (postId, token) => {
  try {
    const { data } = await requestJson(
      `${API_URL}/api/posts/${postId}`,
      {
        headers: buildJsonHeaders(token),
      },
      'Failed to fetch post',
    );
    return data.data;
  } catch (err) {
    console.error('Error fetching post details:', err);
    if (err.status) throw err;
    const e = new Error(`Fetch post details error: ${err.message}`);
    e.status = err.status;
    throw e;
  }
};

export const likePost = async (postId, token, { userId } = {}) => {
  try {
    debugLog('[PostService] likePost called', { postId, hasToken: Boolean(token), userId });

    const { data: responseData } = await requestJson(
      `${API_URL}/api/posts/${postId}/like`,
      {
        method: 'POST',
        headers: buildJsonHeaders(token),
        ...(userId ? { body: JSON.stringify({ userId }) } : {}),
      },
      'Failed to like the post',
    );

    debugLog('[PostService] likePost response', responseData);
    return responseData;
  } catch (error) {
    console.error('[PostService] Error liking post:', error);
    throw new Error(`Like post error: ${error.message}`);
  }
};

export const commentOnPost = async (postId, commentText, token) => {
  try {
    const { data: responseData } = await requestJson(
      `${API_URL}/api/posts/${postId}/comment`,
      {
        method: 'POST',
        headers: buildJsonHeaders(token),
        body: JSON.stringify({ comment: commentText }),
      },
      'Failed to comment on the post',
    );

    return responseData?.data ?? responseData ?? null;
  } catch (error) {
    console.error('Error commenting on post:', error);
    const msg = error?.message || 'Failed to comment on the post';
    throw new Error(`Comment post error: ${msg}`);
  }
};

export const createPost = async ({ title, content, mediaUrl, mediaThumbnailUrl, tags = [], user, userCommunityId, token }) => {
  try {
    const { data: responseData } = await requestJson(
      `${API_URL}/api/posts/create`,
      {
        method: 'POST',
        headers: buildJsonHeaders(token),
        body: JSON.stringify({
          title,
          content,
          media: mediaUrl ? [mediaUrl] : [],
          mediaThumbnails: mediaThumbnailUrl ? [mediaThumbnailUrl] : [],
          author: user.id,
          community: userCommunityId,
          tags,
        }),
      },
      'Failed to create post.',
    );

    return responseData.data;
  } catch (error) {
    console.error('Error creating post:', error);
    throw new Error(`Create post error: ${error.message}`);
  }
};

export const uploadImageWithThumbnail = async (fileUri, fileType, token) => {
  try {
    const formData = new FormData();
    formData.append('file', {
      uri: fileUri,
      type: fileType,
      name: `post-media-${Date.now()}.jpg`,
    });

    const response = await fetch(`${API_URL}/api/upload/upload-image`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(data?.message || 'Failed to upload image');
    }
    if (!data?.originalUrl || !data?.thumbnailUrl) {
      throw new Error('Image upload response was incomplete');
    }

    return {
      originalUrl: data.originalUrl,
      thumbnailUrl: data.thumbnailUrl,
    };
  } catch (err) {
    throw new Error(err?.message || 'Image upload failed');
  }
};

export const uploadVideoWithThumbnail = async (fileUri, fileType, token) => {
  try {
    const fileName = `post-media-${Date.now()}.mp4`;

    const signedUrlResponse = await fetch(
      `${API_URL}/api/upload/s3-video-url?fileName=${fileName}&fileType=${fileType}`,
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const signedUrlData = await signedUrlResponse.json().catch(() => null);
    const url = signedUrlData?.url;
    if (!signedUrlResponse.ok || !url) {
      throw new Error(signedUrlData?.message || 'Failed to get signed URL');
    }

    const fileBlobResponse = await fetch(fileUri);
    if (!fileBlobResponse.ok) {
      throw new Error('Failed to read local video file');
    }
    const fileBlob = await fileBlobResponse.blob();

    const uploadResponse = await fetch(url, {
      method: 'PUT',
      body: fileBlob,
      headers: { 'Content-Type': fileType },
    });
    if (!uploadResponse.ok) throw new Error('Failed to upload video');

    const videoUrl = url.split('?')[0];

    const thumbnailResponse = await fetch(`${API_URL}/api/upload/upload-video`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ videoUrl }),
    });

    const data = await thumbnailResponse.json().catch(() => null);
    if (!thumbnailResponse.ok) {
      throw new Error(data?.message || 'Failed to generate thumbnail');
    }
    if (!data?.videoUrl || !data?.thumbnailUrl) {
      throw new Error('Video upload response was incomplete');
    }

    return {
      originalUrl: data.videoUrl,
      thumbnailUrl: data.thumbnailUrl,
    };
  } catch (err) {
    throw new Error(err?.message || 'Video upload failed');
  }
};

export const flagPost = async (postId, token) => {
  try {
    const { data: responseData } = await requestJson(
      `${API_URL}/api/posts/${postId}/flag`,
      {
        method: 'PATCH',
        headers: buildJsonHeaders(token),
      },
      'Failed to flag post.',
    );
    return responseData.data;
  } catch (error) {
    console.error('Error flagging post:', error);
    throw new Error(`Flag post error: ${error.message}`);
  }
};

export const deletePost = async (postId, token) => {
  try {
    const { data: responseData } = await requestJson(
      `${API_URL}/api/posts/${postId}`,
      {
        method: 'DELETE',
        headers: buildJsonHeaders(token),
      },
      'Failed to delete post.',
    );
    return responseData;
  } catch (error) {
    console.error('Error deleting post:', error);
    throw new Error(`Delete post error: ${error.message}`);
  }
};


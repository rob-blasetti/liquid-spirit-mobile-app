import { API_URL } from '../config';
// Note: UserContext/useContext not needed here

// Fetch the "Explore" feed; requires auth token
export const fetchExploreFeed = async (token) => {
  try {
      if (!token) {
        throw new Error('No authentication token provided for explore feed');
      }
      const response = await fetch(`${API_URL}/api/posts/explore-feed`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
  
      if (!response.ok) {
        throw new Error('Failed to fetch explore posts');
      }
  
      const responseData = await response.json();
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


export const fetchForYouFeed = async (userCommunityId, token) => {
  try {
    return [
      {
        _id: 'static-post',
        media: ['https://liquid-spirit.s3.us-east-1.amazonaws.com/profile-images/post-media-1741928527423.jpg'], // ✅ Wrap in an object
        content: 'A special post just for you!',
        author: { firstName: 'Coming', lastName: 'Soon', profilePicture: 'https://liquid-spirit.s3.us-east-1.amazonaws.com/profile-images/earth.png' },
        community: { name: 'Global Community' },
        likes: [],
        comments: [],
      }
    ];
  } catch (error) {
    console.error('Error fetching For You (community feed):', error);
    throw new Error(`Fetch For You (community feed) error: ${error.message}`);
  }
};
  
  export const fetchRecentCommunityPosts = async (userCommunityId, token) => {
    try {
      const response = await fetch(`${API_URL}/api/posts/community-feed/${userCommunityId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
  
      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }
  
      const responseData = await response.json();
      return responseData.data.slice(0, 5);
    } catch (error) {
      console.error('Error fetching recent posts:', error);
      throw new Error(`Fetch recent community posts error: ${error.message}`);
    }
  };

export const fetchPostDetails = async (postId, token) => {
  try {
    const response = await fetch(`${API_URL}/api/posts/${postId}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      let message = 'Failed to fetch post';
      try {
        const errBody = await response.json();
        if (errBody?.message) message = errBody.message;
      } catch (_) {}
      const err = new Error(message);
      err.status = response.status;
      throw err;
    }

    const data = await response.json();
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
      if (__DEV__) {
        console.log('[PostService] likePost called', { postId, hasToken: Boolean(token), userId });
      }
      const config = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      };

      if (userId) {
        if (__DEV__) {
          console.log('[PostService] sending userId in body');
        }
        config.body = JSON.stringify({ userId });
      }

      const response = await fetch(`${API_URL}/api/posts/${postId}/like`, config);

      if (__DEV__) {
        console.log('[PostService] likePost response', { status: response.status });
      }

      if (!response.ok) {
        let errorMessage = 'Failed to like the post';
        try {
          const errorBody = await response.json();
          if (errorBody?.message) {
            errorMessage = errorBody.message;
          }
        } catch (_) {}

        if (__DEV__) {
          console.log('[PostService] likePost failed', { status: response.status, errorMessage });
        }

        throw new Error(errorMessage);
      }
  
      const responseData = await response.json();

      if (__DEV__) {
        console.log('likePost service call: ', responseData);
      }

      return responseData;
    } catch (error) {
      console.error('[PostService] Error liking post:', error);
      throw new Error(`Like post error: ${error.message}`);
    }
  };

  export const commentOnPost = async (postId, commentText, token) => {
    try {
      const response = await fetch(`${API_URL}/api/posts/${postId}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ comment: commentText }),
      });

      // Try to parse JSON, but tolerate empty/no-JSON responses
      let responseData = null;
      try {
        responseData = await response.json();
      } catch (_) {
        responseData = null;
      }

      if (!response.ok) {
        const msg = responseData?.message || 'Failed to comment on the post';
        throw new Error(msg);
      }

      // Support various backend shapes: {data: ...} | [...] | single object | null
      const data = responseData?.data ?? responseData ?? null;
      return data;
    } catch (error) {
      console.error('Error commenting on post:', error);
      // Normalize error message to avoid leaking parse errors
      const msg = error?.message || 'Failed to comment on the post';
      throw new Error(`Comment post error: ${msg}`);
    }
  };

  export const createPost = async ({ title, content, mediaUrl, mediaThumbnailUrl, tags = [], user, userCommunityId, token }) => {
    try {
      const response = await fetch(`${API_URL}/api/posts/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          content,
          media: mediaUrl ? [mediaUrl] : [],
          mediaThumbnails: mediaThumbnailUrl ? [mediaThumbnailUrl] : [],
          author: user.id,
          community: userCommunityId,
          tags,
        }),
      });
  
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to create post.');
      }
  
      const responseData = await response.json();
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
  
      if (!response.ok) {
        throw new Error('Failed to upload image');
      }
  
      const data = await response.json();
      return {
        originalUrl: data.originalUrl,
        thumbnailUrl: data.thumbnailUrl,
      };
    } catch (err) {
      throw new Error('Image upload failed');
    }
  };
  
  export const uploadVideoWithThumbnail = async (fileUri, fileType, token) => {
    try {
      const fileName = `post-media-${Date.now()}.mp4`;
  
      // === Get signed URL
      const signedUrlResponse = await fetch(
        `${API_URL}/api/upload/s3-video-url?fileName=${fileName}&fileType=${fileType}`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        }
      );
  
      const { url } = await signedUrlResponse.json();
      if (!url) throw new Error('Failed to get signed URL');
  
      // === Upload video to S3
      const fileBlob = await fetch(fileUri).then(res => res.blob());
      const uploadResponse = await fetch(url, {
        method: 'PUT',
        body: fileBlob,
        headers: { 'Content-Type': fileType },
      });
      if (!uploadResponse.ok) throw new Error('Failed to upload video');
  
      const videoUrl = url.split('?')[0];
  
      // === Trigger thumbnail generation
      const thumbnailResponse = await fetch(`${API_URL}/api/upload/upload-video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ videoUrl }),
      });
  
      if (!thumbnailResponse.ok) throw new Error('Failed to generate thumbnail');
  
      const data = await thumbnailResponse.json();
      return {
        originalUrl: data.videoUrl,
        thumbnailUrl: data.thumbnailUrl,
      };
    } catch (err) {
      throw new Error('Video upload failed');
    }
  };

  export const flagPost = async (postId, token) => { 
    try {
      const response = await fetch(`${API_URL}/api/posts/${postId}/flag`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to flag post.');
      }
  
      const responseData = await response.json();
      return responseData.data;
    } catch (error) {
      console.error('Error flagging post:', error);
      throw new Error(`Flag post error: ${error.message}`);
    }
  };

  export const deletePost = async (postId, token) => { 
    try {
      const response = await fetch(`${API_URL}/api/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('response: ', response);
  
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete post.');
      }
  
      const responseData = await response.json();
      return responseData;
    } catch (error) {
      console.error('Error deleting post:', error);
      throw new Error(`Delete post error: ${error.message}`);
    }
  };
 

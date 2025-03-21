import { API_URL } from '../config';
import { UserContext } from '../contexts/UserContext';
import { useContext } from 'react';

export const fetchExploreFeed = async () => {
  try {
      const response = await fetch(`${API_URL}/api/posts/explore-feed`, {
        headers: {
          'Content-Type': 'application/json'
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

  export const likePost = async (postId, token) => {
    try {
      const response = await fetch(`${API_URL}/api/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
  
      if (!response.ok) {
        throw new Error('Failed to like the post');
      }
  
      const responseData = await response.json();

      console.log('likePost service call: ', responseData);

      return responseData;
    } catch (error) {
      console.error('Error liking post:', error);
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
        body: JSON.stringify({
          comment: commentText,
        }),
      });
  
      if (!response.ok) {
        throw new Error('Failed to comment on the post');
      }
  
      const responseData = await response.json();
      return responseData.data; // Return updated post data or comment data
    } catch (error) {
      console.error('Error commenting on post:', error);
      throw new Error(`Comment post error: ${error.message}`);
    }
  };

  export const createPost = async ({ title, content, mediaUrl, user, userCommunityId, token }) => {
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
          author: user.id,
          community: userCommunityId,
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
  
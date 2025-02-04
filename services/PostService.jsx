import API_URL from '../config';
import { UserContext } from '../contexts/UserContext';
import { useContext } from 'react';

export const fetchExploreFeed = async (token) => {
  try {
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

  export const fetchForYouFeed = async (userCommunityId, token) => {
    try {
        const response = await fetch(`${API_URL}/api/posts/community-feed/${userCommunityId}`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
    
        if (!response.ok) {
          throw new Error('Failed to fetch For You posts');
        }
    
        const responseData = await response.json();
        return responseData.data;
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
      return responseData.data; // Return updated post data or like count
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
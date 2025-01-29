import React, { useEffect, useContext, useState }  from 'react';
import { View, Text, FlatList, StyleSheet, Image, ActivityIndicator } from 'react-native';

import { UserContext } from '../contexts/UserContext';
// import { API_URL, ENVIRONMENT } from '@env';

const SocialMedia = () => {
    const { token, communityId } = useContext(UserContext);
    const [posts, setPosts] = useState('');
    const [loading, setLoading] = useState(true);

    // console.log('API URL:', API_URL);
    // console.log('Environment:', ENVIRONMENT);

    const devAPI = 'http://localhost:5005';
    const stagingAPI = 'https://liquid-spirit-backend-staging-2a7049350332.herokuapp.com';

    useEffect(() => {
        const fetchPosts = async () => {
          try {
            const response = await fetch(`${stagingAPI}/api/posts/community-feed/${communityId}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
            });
            const result = await response.json();
            if (result.success) {
                setPosts(result.data);
            }
          } catch (error) {
            console.error('Error fetching events:', error);
          } finally {
            setLoading(false);
          }
        };
    
        fetchPosts();
    }, [communityId, token]);

    const RenderPost = React.memo(({ item }) => {
        // Author Info
        const authorName = `${item.author?.firstName || 'Unknown'} ${item.author?.lastName || 'Author'}`;
        const profilePic = item.author?.profilePicture || 'https://via.placeholder.com/50';
      
        // Media
        const mediaUrl = item.media[0] || 'https://via.placeholder.com/200';
      
        // Likes and Comments
        const likeCount = item.likes?.length || 0;
        const commentCount = item.comments?.length || 0;
      
        return (
          <View style={styles.postContainer}>
            {/* Author Info */}
            <View style={styles.userInfo}>
              <Image source={{ uri: profilePic }} style={styles.profilePic} />
              <Text style={styles.username}>{authorName}</Text>
            </View>
      
            {/* Media */}
            <Image source={{ uri: mediaUrl }} style={styles.postImage} />
      
            {/* Title and Content */}
            <Text style={styles.postTitle}>{item.title}</Text>
            <Text style={styles.postContent}>{item.content}</Text>
      
            {/* Footer: Likes and Comments */}
            <View style={styles.postFooter}>
              <Text style={styles.footerText}>❤️ {likeCount} Likes</Text>
              <Text style={styles.footerText}>💬 {commentCount} Comments</Text>
            </View>
          </View>
        );
      });
    
      return (
        <View style={styles.container}>
          {loading ? (
            <ActivityIndicator size="large" color="#0485e2" />
          ) : (
            <FlatList
            data={posts}
            renderItem={({ item }) => <RenderPost item={item} />}
            keyExtractor={(item) => item._id.toString()}
            contentContainerStyle={styles.list}
            initialNumToRender={5}
            maxToRenderPerBatch={5}
            windowSize={10}
            removeClippedSubviews={true}
            getItemLayout={(data, index) => ({
                length: 300,
                offset: 300 * index,
                index,
            })}
            />
          )}
        </View>
      );
    };
    
    const styles = StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
      },
      list: {
        padding: 10,
      },
      postContainer: {
        marginBottom: 20,
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
      },
      userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
      },
      profilePic: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 10,
      },
      username: {
        fontSize: 16,
        fontWeight: 'bold',
      },
      postImage: {
        width: '100%',
        height: 200,
        borderRadius: 10,
        marginBottom: 10,
        resizeMode: 'cover'
      },
      postTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
      },
      caption: {
        fontSize: 14,
        color: '#555',
      },
    });
    
    export default SocialMedia;
import React, { useEffect, useContext, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, Image, ActivityIndicator, RefreshControl } from 'react-native';
import FastImage from 'react-native-fast-image';

import { UserContext } from '../contexts/UserContext';

const stagingAPI = 'https://liquid-spirit-backend-staging-2a7049350332.herokuapp.com';

const SocialMedia = () => {
    const { token, communityId, userPosts } = useContext(UserContext);
    const [posts, setPosts] = useState(userPosts || []);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchPosts = useCallback(async () => {
        try {
            setLoading(true);
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
            console.error('Error fetching posts:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [token, communityId]);

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchPosts();
    }, [fetchPosts]);

    const RenderPost = React.memo(({ item }) => {
        const authorName = `${item.author?.firstName || 'Unknown'} ${item.author?.lastName || 'Author'}`;
        const profilePic = item.author?.profilePicture || 'https://via.placeholder.com/50';
        const mediaUrl = item.media?.[0] || 'https://via.placeholder.com/200';
        const likeCount = item.likes?.length || 0;
        const commentCount = item.comments?.length || 0;

        return (
            <View style={styles.postContainer}>
                <View style={styles.userInfo}>
                    <FastImage
                        source={{ uri: profilePic }}
                        style={styles.profilePic}
                        resizeMode={FastImage.resizeMode.cover}
                    />
                    <Text style={styles.username}>{authorName}</Text>
                </View>
                <FastImage
                    source={{ uri: mediaUrl }} 
                    style={styles.postImage}
                    resizeMode={FastImage.resizeMode.cover}
                />
                <Text style={styles.postTitle}>{item.title}</Text>
                <Text style={styles.postContent}>{item.content}</Text>
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
                    keyExtractor={(item, index) => item._id ? item._id.toString() : index.toString()}
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
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#0485e2"]} />
                    }
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
        resizeMode: 'cover',
    },
    postTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    postContent: {
        fontSize: 14,
        color: '#555',
    },
    postFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    footerText: {
        fontSize: 14,
        color: '#777',
    },
});

export default SocialMedia;

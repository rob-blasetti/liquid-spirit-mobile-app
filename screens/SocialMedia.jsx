import React, { useEffect, useContext, useState, useCallback, useRef } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    RefreshControl,
    TouchableOpacity,
    TextInput,
    Modal,
    Button,
    Alert
} from 'react-native';
import FastImage from 'react-native-fast-image';
import API_URL from '../config';
// Example service functions (assuming these are already implemented in PostService)
import { likePost, commentOnPost } from '../services/PostService';

import { UserContext } from '../contexts/UserContext';

const DOUBLE_TAP_DELAY = 300; // max delay (ms) between taps for a double-tap

const SocialMedia = () => {
    const { token, communityId, userPosts } = useContext(UserContext);
    const [posts, setPosts] = useState(userPosts || []);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Comment modal state
    const [commentModalVisible, setCommentModalVisible] = useState(false);
    const [currentPostId, setCurrentPostId] = useState(null);
    const [commentText, setCommentText] = useState('');

    const fetchPosts = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/api/posts/community-feed/${communityId}`, {
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

    // Handle liking a post
    const handleLike = useCallback(
        async (postId) => {
            try {
                const response = await likePost(postId, token);
                if (response.success) {
                    // We assume response.data contains the updated post
                    const updatedPost = response.data;
                    // Update the post in our local state
                    setPosts((prevPosts) =>
                        prevPosts.map((p) => (p._id === postId ? updatedPost : p))
                    );
                } else {
                    Alert.alert('Like Failed', response.message || 'Unable to like post');
                }
            } catch (error) {
                console.error('Error liking post:', error);
                Alert.alert('Error', 'An error occurred while liking the post');
            }
        },
        [token]
    );

    // Handle showing the comment modal
    const openCommentModal = (postId) => {
        setCurrentPostId(postId);
        setCommentText('');
        setCommentModalVisible(true);
    };

    // Submit comment
    const submitComment = useCallback(
        async () => {
            if (!commentText.trim()) {
                return Alert.alert('Error', 'Comment cannot be empty');
            }
            try {
                const response = await commentOnPost(currentPostId, commentText, token);
                if (response.success) {
                    // We assume response.data contains the updated post with new comment
                    const updatedPost = response.data;
                    // Update the post in our local state
                    setPosts((prevPosts) =>
                        prevPosts.map((p) => (p._id === currentPostId ? updatedPost : p))
                    );
                    setCommentModalVisible(false);
                    setCommentText('');
                } else {
                    Alert.alert('Comment Failed', response.message || 'Unable to comment on post');
                }
            } catch (error) {
                console.error('Error commenting on post:', error);
                Alert.alert('Error', 'An error occurred while commenting on the post');
            }
        },
        [currentPostId, token, commentText]
    );

    const RenderPost = React.memo(({ item }) => {
        const authorName = `${item.author?.firstName || 'Unknown'} ${item.author?.lastName || 'Author'}`;
        const authorCommunity = `${item.community?.name || 'Unknown'}`;
        const profilePic = item.author?.profilePicture || 'https://via.placeholder.com/50';
        const mediaUrl = item.media?.[0] || 'https://via.placeholder.com/200';
        const likeCount = item.likes?.length || 0;
        const commentCount = item.comments?.length || 0;

        // For double-tap detection
        const lastTapRef = useRef(0);

        const handlePostPress = () => {
            const now = Date.now();
            if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
                // Double tap detected
                handleLike(item._id);
            }
            lastTapRef.current = now;
        };

        return (
            <TouchableOpacity
                style={styles.postContainer}
                activeOpacity={1}
                onPress={handlePostPress}
            >
                <View style={styles.userInfoContainer}>
                    <View style={styles.userInfo}>
                        <FastImage
                            source={{ uri: profilePic }}
                            style={styles.profilePic}
                            resizeMode={FastImage.resizeMode.cover}
                        />
                        <Text style={styles.username}>{authorName}</Text>
                    </View>
                    <View style={styles.communityChip}>
                        <Text style={styles.communityText}>{authorCommunity}</Text>
                    </View>
                </View>

                <FastImage
                    source={{ uri: mediaUrl }}
                    style={styles.postImage}
                    resizeMode={FastImage.resizeMode.cover}
                />

                <Text style={styles.postTitle}>{item.title}</Text>
                <Text style={styles.postContent}>{item.content}</Text>

                <View style={styles.postFooter}>
                    {/* Like button & count (single press)*/}
                    <TouchableOpacity onPress={() => handleLike(item._id)}>
                        <Text style={styles.footerText}>❤️ {likeCount} Likes</Text>
                    </TouchableOpacity>

                    {/* Comment button & count */}
                    <TouchableOpacity onPress={() => openCommentModal(item._id)}>
                        <Text style={styles.footerText}>💬 {commentCount} Comments</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
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
                    keyExtractor={(item, index) => (item._id ? item._id.toString() : index.toString())}
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
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={["#0485e2"]}
                        />
                    }
                />
            )}

            {/* Comment Modal */}
            <Modal
                visible={commentModalVisible}
                animationType="slide"
                transparent={true}
            >
                <View style={styles.modalBackground}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>Add a Comment</Text>
                        <TextInput
                            style={styles.commentInput}
                            placeholder="Write your comment..."
                            value={commentText}
                            onChangeText={setCommentText}
                            multiline
                        />
                        <View style={styles.modalButtonRow}>
                            <Button title="Cancel" onPress={() => setCommentModalVisible(false)} />
                            <Button title="Submit" onPress={submitComment} />
                        </View>
                    </View>
                </View>
            </Modal>
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
    userInfoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
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
    communityChip: {
        backgroundColor: '#312783',
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 20,
        alignSelf: 'flex-start',
    },
    communityText: {
        fontSize: 14,
        color: '#fff',
        fontWeight: '600',
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
    // Modal styles
    modalBackground: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContainer: {
        width: '80%',
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    commentInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        height: 100,
        marginBottom: 10,
        textAlignVertical: 'top',
    },
    modalButtonRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
});

export default SocialMedia;

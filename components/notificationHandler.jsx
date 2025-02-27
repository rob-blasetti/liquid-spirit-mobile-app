import { useEffect } from 'react';
import { Alert } from 'react-native';
import socket from '../socket';
import { useUser } from '../contexts/UserContext';

const NotificationHandler = () => {
    const { user, addNotification } = useUser();
    const communityId = user?.community?._id;
    
    console.log('user.community?._id: ', user?.community?._id);

    useEffect(() => {
        if (!user) {
            console.error('❌ User missing:', user);
            return;
        }

        console.log(`🔗 NotificationHandler: Attempting to join WebSocket community room: community-${communityId}`);
        socket.emit('joinCommunityRoom', communityId);

        socket.on('connect', () => {
            console.log('✅ NotificationHandler: Connected to WebSocket:', socket.id);
        });

        socket.on('receiveNotification', (data) => {
            console.log('🔔 NotificationHandler: Received Notification:', data);
            addNotification(data);
            Alert.alert('NotificationHandler: Test Notification', data.additionalData.caption);
        });

        socket.onAny((event, data) => {
            console.log(`🔍 NotificationHandler: Received WebSocket event: ${event}`, data);
        });

        socket.on('disconnect', () => {
            console.log('❌ NotificationHandler: WebSocket disconnected.');
        });

        return () => {
            socket.off('receiveNotification');
            socket.offAny();
        };
    }, [user]);

    return null;
};

export default NotificationHandler;

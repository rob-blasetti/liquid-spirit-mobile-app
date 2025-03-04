import { useEffect } from 'react';
import { Alert } from 'react-native';
import socket from '../socket';
import { useUser } from '../contexts/UserContext';

const NotificationHandler = () => {
    const { user, addNotification } = useUser();
    const communityId = user?.community?._id;
    
    useEffect(() => {
        if (!user || !communityId) {
            console.warn('❌ User or Community ID missing:', user, communityId);
            return;
        }
    
        console.log(`🔗 Attempting to join WebSocket community room: community-${communityId}`);
        
        socket.emit('joinCommunityRoom', communityId, (response) => {
            console.log('🟢 Server acknowledged room join:', response);
        });
    
        socket.on('connect', () => {
            console.log('✅ Connected to WebSocket:', socket.id);
        });
    
        socket.on('receiveNotification', (data) => {
            console.log('🔔 Received Notification:', data);
            addNotification(data);
            Alert.alert('Notification', data?.additionalData?.caption || "No caption available");
        });
    
        socket.onAny((event, data) => {
            console.log(`🔍 Received WebSocket event: ${event}`, data);
        });
    
        socket.on('disconnect', () => {
            console.log('❌ WebSocket disconnected.');
        });
    
        return () => {
            socket.off('receiveNotification');
            socket.offAny();
        };
    }, [user, communityId]);       

    return null;
};

export default NotificationHandler;

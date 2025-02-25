import { useEffect } from 'react';
import { Alert } from 'react-native';
import socket from '../socket';
import { useUser } from '../contexts/UserContext';

const NotificationHandler = () => {
    const { addNotification } = useUser(); // ✅ Use context to store notifications

    useEffect(() => {
        socket.on('connect', () => {
            console.log('✅ Connected to WebSocket:', socket.id);
        });

        socket.on('receiveNotification', (data) => {
            console.log('🔔 Received Notification:', data);
            addNotification(data); // ✅ Store in context
            Alert.alert('Notification', data.message);
        });

        return () => {
            socket.off('receiveNotification');
            socket.off('connect');
        };
    }, []);

    return null; // No UI needed, just handles background WebSocket logic
};

export default NotificationHandler;

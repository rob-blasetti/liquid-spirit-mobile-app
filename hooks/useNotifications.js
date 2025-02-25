import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import socket from '../socket';

export const useNotifications = () => {
    const [notification, setNotification] = useState(null);

    useEffect(() => {
        socket.on('connect', () => {
            console.log('✅ Connected to WebSocket:', socket.id);
        });

        socket.on('receiveNotification', (data) => {
            console.log('🔔 Received Notification:', data);
            setNotification(data);
            Alert.alert('Notification', data.message);
        });

        return () => {
            socket.off('receiveNotification');
            socket.off('connect');
        };
    }, []);

    const sendNotification = (message) => {
        socket.emit('sendNotification', { message });
    };

    return { notification, sendNotification };
};

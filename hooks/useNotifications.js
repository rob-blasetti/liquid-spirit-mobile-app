import { useState, useEffect } from 'react';
import socket from '../socket';

export const useNotifications = () => {
    const [notification, setNotification] = useState(null);

    useEffect(() => {
        const handleNotification = (data) => {
            console.log('🔔 New notification received:', data);
            setNotification(data);
        };

        socket.on('receiveNotification', handleNotification);

        return () => {
            socket.off('receiveNotification', handleNotification);
        };
    }, []);

    const sendNotification = (message) => {
        socket.emit('sendNotification', { message });
    };

    return { notification, sendNotification };
};

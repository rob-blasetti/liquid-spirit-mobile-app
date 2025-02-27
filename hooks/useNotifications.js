import { useState } from 'react';
import socket from '../socket';

export const useNotifications = () => {
    const [notification, setNotification] = useState(null);

    const sendNotification = (message) => {
        socket.emit('sendNotification', { message });
    };

    return { notification, sendNotification };
};

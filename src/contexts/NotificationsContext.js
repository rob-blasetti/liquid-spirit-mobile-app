import React, {createContext, useContext} from 'react';
import usePersistedState from '../hooks/usePersistedState';

const NotificationsContext = createContext();

export const NotificationsProvider = ({children}) => {
  const [notifications, setNotifications] = usePersistedState('notifications', []);

  const addNotification = notification => {
    setNotifications([...notifications, notification]);
  };

  const removeNotification = id => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  return (
    <NotificationsContext.Provider value={{notifications, addNotification, removeNotification}}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotificationsContext = () => useContext(NotificationsContext);

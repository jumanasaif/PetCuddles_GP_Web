// NotificationContext.js
import { createContext, useState } from 'react';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  return (
    <NotificationContext.Provider value={{
      notifications,
      setNotifications,
      unreadCount,
      setUnreadCount
    }}>
      {children}
    </NotificationContext.Provider>
  );
};
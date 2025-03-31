// src/contexts/NotificationContext.tsx
'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import Notification, { NotificationType } from '../components/ui/Notification';

interface NotificationContextProps {
  showNotification: (
    type: NotificationType,
    message: string,
    description?: string,
    duration?: number
  ) => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  description?: string;
  duration?: number;
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = (
    type: NotificationType,
    message: string,
    description?: string,
    duration = 5000
  ) => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications(prevNotifications => [
      ...prevNotifications,
      { id, type, message, description, duration }
    ]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prevNotifications => 
      prevNotifications.filter(notification => notification.id !== id)
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider value={{ showNotification, clearNotifications }}>
      {children}
      
      {/* Afficher les notifications dans un conteneur fixe */}
      {notifications.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 max-w-md">
          {notifications.map(({ id, type, message, description, duration }) => (
            <Notification
              key={id}
              type={type}
              message={message}
              description={description}
              duration={duration}
              onClose={() => removeNotification(id)}
            />
          ))}
        </div>
      )}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
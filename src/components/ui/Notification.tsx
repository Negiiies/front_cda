// src/components/ui/Notification.tsx
import React, { useState, useEffect } from 'react';
import { 
  CheckCircleIcon, 
  ExclamationCircleIcon, 
  InformationCircleIcon, 
  XMarkIcon 
} from '@heroicons/react/24/outline';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface NotificationProps {
  type: NotificationType;
  message: string;
  description?: string;
  duration?: number; // Durée en millisecondes, 0 signifie la notification ne disparaît pas automatiquement
  onClose?: () => void;
  className?: string;
}

export default function Notification({
  type = 'info',
  message,
  description,
  duration = 5000, // 5 secondes par défaut
  onClose,
  className = '',
}: NotificationProps) {
  const [isVisible, setIsVisible] = useState(true);

  // Configuration des couleurs et icônes selon le type
  const config = {
    success: {
      icon: <CheckCircleIcon className="h-6 w-6" />,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-800',
      iconColor: 'text-green-500',
    },
    error: {
      icon: <ExclamationCircleIcon className="h-6 w-6" />,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800',
      iconColor: 'text-red-500',
    },
    warning: {
      icon: <ExclamationCircleIcon className="h-6 w-6" />,
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-800',
      iconColor: 'text-yellow-500',
    },
    info: {
      icon: <InformationCircleIcon className="h-6 w-6" />,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-800',
      iconColor: 'text-blue-500',
    },
  };

  const { icon, bgColor, borderColor, textColor, iconColor } = config[type];

  // Timer pour fermer automatiquement la notification
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (duration > 0) {
      timer = setTimeout(() => {
        setIsVisible(false);
        if (onClose) onClose();
      }, duration);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [duration, onClose]);

  // Si la notification n'est pas visible, ne rien afficher
  if (!isVisible) return null;

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) onClose();
  };

  return (
    <div 
      className={`${bgColor} ${borderColor} ${textColor} border px-4 py-3 rounded-lg flex items-start ${className}`}
      role="alert"
    >
      <div className={`flex-shrink-0 ${iconColor} mr-3 mt-0.5`}>
        {icon}
      </div>
      <div className="flex-grow">
        <p className="font-medium">{message}</p>
        {description && <p className="text-sm mt-1">{description}</p>}
      </div>
      <button
        onClick={handleClose}
        className={`flex-shrink-0 ml-3 ${textColor} hover:${textColor} focus:outline-none`}
        aria-label="Fermer"
      >
        <XMarkIcon className="h-5 w-5" />
      </button>
    </div>
  );
}
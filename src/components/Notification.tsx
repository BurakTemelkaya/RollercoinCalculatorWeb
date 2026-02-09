import React, { useEffect } from 'react';
import './Notification.css';

interface NotificationProps {
    message: string;
    type: 'success' | 'error' | 'info';
    onClose: () => void;
    duration?: number;
}

const Notification: React.FC<NotificationProps> = ({
    message,
    type,
    onClose,
    duration = 3000
}) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    return (
        <div className={`notification-toast ${type}`}>
            <div className="notification-icon">
                {type === 'error' && '⚠️'}
                {type === 'success' && '✅'}
                {type === 'info' && 'ℹ️'}
            </div>
            <div className="notification-message">{message}</div>
            <button className="notification-close" onClick={onClose}>×</button>
        </div>
    );
};

export default Notification;

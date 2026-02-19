import React, { useEffect, useState } from 'react';
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
    const [isExiting, setIsExiting] = useState(false);

    const handleClose = () => {
        if (isExiting) return;
        setIsExiting(true);
        // Wait for animation to finish (800ms)
        setTimeout(() => {
            onClose();
        }, 800);
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            handleClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration]);

    return (
        <div className={`notification-toast ${type} ${isExiting ? 'slide-out' : ''}`}>
            <div className="notification-icon">
                {type === 'error' && '⚠️'}
                {type === 'success' && '✅'}
                {type === 'info' && 'ℹ️'}
            </div>
            <div className="notification-message">{message}</div>
            <button className="notification-close" onClick={handleClose}>×</button>
        </div>
    );
};

export default Notification;

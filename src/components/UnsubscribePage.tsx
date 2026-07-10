import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { unsubscribeEmails } from '../services/notificationApi';
import './auth/AuthPages.css';

export default function UnsubscribePage() {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

    useEffect(() => {
        const token = searchParams.get('token');
        if (!token) {
            setStatus('error');
            return;
        }

        const handleUnsubscribe = async () => {
            try {
                const success = await unsubscribeEmails(token);
                if (success) {
                    setStatus('success');
                } else {
                    setStatus('error');
                }
            } catch (err) {
                console.error('Unsubscribe error:', err);
                setStatus('error');
            }
        };

        handleUnsubscribe();
    }, [searchParams]);

    return (
        <div className="auth-container" style={{ maxWidth: '600px', margin: '40px auto' }}>
            <div className="auth-card" style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div className="auth-header">
                    <h2>{t('unsubscribe.title', 'Unsubscribe')}</h2>
                </div>
                
                {status === 'loading' && (
                    <div style={{ padding: '20px' }}>
                        <span className="spinner"></span>
                        <p style={{ marginTop: '16px', color: '#94a3b8' }}>
                            {t('unsubscribe.processing', 'Processing your request...')}
                        </p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="auth-success" style={{ 
                        padding: '24px', 
                        background: 'rgba(52, 211, 153, 0.1)', 
                        color: '#34d399', 
                        borderRadius: '12px', 
                        border: '1px solid rgba(52, 211, 153, 0.2)',
                        marginTop: '20px'
                    }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>✓</div>
                        <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem' }}>
                            {t('unsubscribe.successTitle', 'Unsubscribed Successfully')}
                        </h3>
                        <p style={{ margin: 0, color: '#e2e8f0' }}>
                            {t('unsubscribe.successDesc', 'You have been successfully unsubscribed from our mailing list. You will no longer receive emails from us.')}
                        </p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="auth-error" style={{ 
                        padding: '24px', 
                        background: 'rgba(239, 68, 68, 0.1)', 
                        color: '#f87171', 
                        borderRadius: '12px', 
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        marginTop: '20px'
                    }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>✗</div>
                        <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem' }}>
                            {t('unsubscribe.errorTitle', 'Unsubscribe Failed')}
                        </h3>
                        <p style={{ margin: 0, color: '#e2e8f0' }}>
                            {t('unsubscribe.errorDesc', 'We could not process your unsubscribe request. The link might be invalid or expired.')}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

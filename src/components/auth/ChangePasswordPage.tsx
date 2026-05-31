import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { updatePassword } from '../../services/userApi';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../DashboardLayout';
import './AuthPages.css';

export default function ChangePasswordPage() {
  const { t } = useTranslation();
  const { user, accessToken, isAdmin } = useAuth();

  const [existPassword, setExistPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setError(t('auth.passwordsDoNotMatch', 'Şifreler eşleşmiyor.'));
      return;
    }

    if (!user || !accessToken) {
      setError(t('auth.notLoggedIn', 'Oturum açmanız gerekiyor.'));
      return;
    }

    setIsLoading(true);
    try {
      await updatePassword({
        existPassword,
        newPassword
      }, accessToken);

      setSuccess(t('auth.passwordUpdated', 'Şifreniz başarıyla güncellendi.'));
      setExistPassword('');
      setNewPassword('');
      setConfirmPassword('');

    } catch (err: any) {
      console.error(err);
      setError(err.message || t('auth.passwordUpdateFailed', 'Şifre güncellenirken bir hata oluştu.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout title={t('auth.changePassword', 'Şifre Değiştir')} isAdmin={isAdmin}>
      <div style={{ maxWidth: '500px', margin: '0 auto', paddingTop: '20px' }}>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '8px', color: '#f8fafc' }}>
          {t('auth.changePassword', 'Şifre Değiştir')}
        </h1>
        <p style={{ color: '#94a3b8', marginBottom: '32px', fontSize: '0.95rem' }}>
          {t('auth.changePasswordDesc', 'Hesabınızın güvenliği için şifrenizi güçlü tutun.')}
        </p>

        <form onSubmit={handleSubmit} style={{ background: 'rgba(15, 15, 30, 0.4)', padding: '32px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
          {error && (
            <div style={{ marginBottom: '24px', padding: '14px 16px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#f87171', borderRadius: '10px', border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              {error}
            </div>
          )}
          {success && (
            <div style={{ marginBottom: '24px', padding: '14px 16px', backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#4ade80', borderRadius: '10px', border: '1px solid rgba(34, 197, 94, 0.2)', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
              {success}
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1', fontSize: '0.9rem', fontWeight: 500 }}>
              {t('auth.currentPassword', 'Mevcut Şifre')}
            </label>
            <input
              type="password"
              value={existPassword}
              onChange={(e) => setExistPassword(e.target.value)}
              required
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '10px',
                background: 'rgba(0, 0, 0, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#fff',
                fontSize: '1rem',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1', fontSize: '0.9rem', fontWeight: 500 }}>
              {t('auth.newPassword', 'Yeni Şifre')}
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '10px',
                background: 'rgba(0, 0, 0, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#fff',
                fontSize: '1rem',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
            />
          </div>

          <div style={{ marginBottom: '32px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1', fontSize: '0.9rem', fontWeight: 500 }}>
              {t('auth.confirmNewPassword', 'Yeni Şifre (Tekrar)')}
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '10px',
                background: 'rgba(0, 0, 0, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#fff',
                fontSize: '1rem',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: '#8b5cf6',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '1rem',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              opacity: isLoading ? 0.7 : 1,
              transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
            }}
            onMouseOver={(e) => { if (!isLoading) e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseOut={(e) => { if (!isLoading) e.currentTarget.style.transform = 'translateY(0)' }}
          >
            {isLoading ? (
              <span style={{ display: 'inline-block', width: '20px', height: '20px', border: '3px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></span>
            ) : (
              t('auth.updatePassword', 'Şifreyi Güncelle')
            )}
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
}

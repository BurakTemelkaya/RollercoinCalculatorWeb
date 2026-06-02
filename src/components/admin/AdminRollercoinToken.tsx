import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { updateRollercoinToken } from '../../services/adminApi';
import DashboardLayout from '../DashboardLayout';
import '../BlogPage.css';

export default function AdminRollercoinToken() {
  const { getValidToken } = useAuth();
  
  const [accessToken, setAccessToken] = useState('');
  const [refreshToken, setRefreshToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!accessToken || !refreshToken) {
      setMessage({ type: 'error', text: 'Lütfen hem Access Token hem de Refresh Token giriniz.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await getValidToken();
      if (!token) {
        throw new Error('Yetkiniz yok veya oturum süreniz dolmuş.');
      }

      const success = await updateRollercoinToken({ accessToken, refreshToken }, token);
      if (success) {
        setMessage({ type: 'success', text: 'Token başarıyla güncellendi!' });
        setAccessToken('');
        setRefreshToken('');
      } else {
        setMessage({ type: 'error', text: 'Token güncelleme işlemi başarısız oldu (false döndü).' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.detail || err.message || 'Bir hata oluştu.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout title="Rollercoin Token Güncelleme" isAdmin={true}>
      <div className="blog-page">
        <div className="blog-container" style={{ maxWidth: 600, margin: '0 auto' }}>
          
          <h1 style={{ marginTop: 0, marginBottom: '1rem', color: '#e2e8f0', fontSize: '1.5rem' }}>
            Rollercoin Hesap Token Güncelleme
          </h1>
          
          <div style={{
            padding: '16px',
            marginBottom: '24px',
            background: 'rgba(234, 179, 8, 0.1)',
            borderLeft: '4px solid #eab308',
            borderRadius: '0 8px 8px 0',
            color: '#fef08a',
            fontSize: '0.95rem',
            lineHeight: 1.5
          }}>
            <strong>⚠️ DİKKAT:</strong> Bu işlem sitenin bağlı olduğu hesabın (botun/hesabın) giriş bilgilerini yenilemek içindir.
          </div>

          {message && (
            <div style={{
              padding: '12px 16px',
              marginBottom: '24px',
              borderRadius: '8px',
              background: message.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${message.type === 'success' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
              color: message.type === 'success' ? '#4ade80' : '#f87171'
            }}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label htmlFor="accessToken" style={{ color: '#cbd5e1', fontWeight: 500 }}>Access Token</label>
              <textarea
                id="accessToken"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder="Rollercoin Access Token (JWT)..."
                rows={5}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(15, 15, 30, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#e2e8f0',
                  fontSize: '0.95rem',
                  fontFamily: 'monospace',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label htmlFor="refreshToken" style={{ color: '#cbd5e1', fontWeight: 500 }}>Refresh Token</label>
              <textarea
                id="refreshToken"
                value={refreshToken}
                onChange={(e) => setRefreshToken(e.target.value)}
                placeholder="Rollercoin Refresh Token..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(15, 15, 30, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#e2e8f0',
                  fontSize: '0.95rem',
                  fontFamily: 'monospace',
                  resize: 'vertical'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                background: '#8b5cf6',
                color: '#ffffff',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.7 : 1,
                transition: 'background 0.2s',
                marginTop: '8px'
              }}
            >
              {isSubmitting ? 'Güncelleniyor...' : 'Tokenları Güncelle'}
            </button>
          </form>

        </div>
      </div>
    </DashboardLayout>
  );
}

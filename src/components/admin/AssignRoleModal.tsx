import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getOperationClaims, assignRoleToUser } from '../../services/adminApi';
import { GetListOperationClaimDto, GetUserDto } from '../../types/auth';
import '../auth/AuthPages.css';

interface AssignRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: GetUserDto | null;
  onSuccess: () => void;
}

export default function AssignRoleModal({ isOpen, onClose, user, onSuccess }: AssignRoleModalProps) {
  const { accessToken } = useAuth();

  const [claims, setClaims] = useState<GetListOperationClaimDto[]>([]);
  const [selectedClaimId, setSelectedClaimId] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingRoles, setIsFetchingRoles] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && accessToken) {
      fetchRoles();
    } else {
      // Reset state when closed
      setError(null);
      setSuccess(null);
      setSelectedClaimId('');
    }
  }, [isOpen, accessToken]);

  const fetchRoles = async () => {
    setIsFetchingRoles(true);
    setError(null);
    try {
      // Fetch up to 100 roles
      const response = await getOperationClaims(accessToken!, 0, 100);
      setClaims(response.items || []);
      if (response.items && response.items.length > 0) {
        setSelectedClaimId(response.items[0].id);
      }
    } catch (err: any) {
      console.error('Error fetching roles:', err);
      setError('Roller yüklenirken hata oluştu.');
    } finally {
      setIsFetchingRoles(false);
    }
  };

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedClaimId) {
      setError('Lütfen bir rol seçin.');
      return;
    }

    if (!accessToken) {
      setError('Oturum açmanız gerekiyor.');
      return;
    }

    // Check if user already has this role
    if (user.userOperationClaims?.some(c => c.operationClaimId === selectedClaimId)) {
      setError('Kullanıcı zaten bu role sahip.');
      return;
    }

    setIsLoading(true);
    try {
      await assignRoleToUser({
        userId: user.id,
        operationClaimId: selectedClaimId
      }, accessToken);

      setSuccess('Rol başarıyla atandı.');

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Rol atanırken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000, background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', inset: 0 }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '420px', background: '#0f172a', borderRadius: '16px', padding: '24px', boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)', border: '1px solid rgba(255,255,255,0.05)', position: 'relative' }}>
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#f8fafc' }}>Rol Ata</h2>
          <button className="modal-close" onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = '#fff'} onMouseOut={e => e.currentTarget.style.color = '#94a3b8'}>&times;</button>
        </div>

        <div style={{ marginBottom: '24px', padding: '16px', background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.1)', borderRadius: '12px', color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.5' }}>
          <strong style={{ color: '#f8fafc', display: 'block', fontSize: '1.05rem', marginBottom: '4px' }}>{user.name}</strong> 
          <span style={{ color: '#94a3b8' }}>{user.email}</span>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div style={{ marginBottom: '20px', padding: '12px 16px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#f87171', borderRadius: '10px', border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}
          {success && (
            <div style={{ marginBottom: '20px', padding: '12px 16px', backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#4ade80', borderRadius: '10px', border: '1px solid rgba(34, 197, 94, 0.2)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              {success}
            </div>
          )}

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1', fontSize: '0.9rem', fontWeight: 500 }}>Atanacak Rol</label>
            {isFetchingRoles ? (
              <div style={{ padding: '14px 16px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.95rem' }}>
                <span className="spinner-small" style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#8b5cf6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></span>
                Roller Yükleniyor...
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <select
                  value={selectedClaimId}
                  onChange={(e) => setSelectedClaimId(e.target.value)}
                  disabled={isLoading || claims.length === 0}
                  style={{ 
                    appearance: 'none',
                    width: '100%', 
                    padding: '14px 16px', 
                    borderRadius: '10px', 
                    background: 'rgba(0, 0, 0, 0.2)', 
                    color: '#f8fafc', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    fontSize: '0.95rem',
                    fontWeight: 500,
                    outline: 'none',
                    cursor: (isLoading || claims.length === 0) ? 'not-allowed' : 'pointer',
                    transition: 'border-color 0.2s, background 0.2s',
                    opacity: (isLoading || claims.length === 0) ? 0.6 : 1
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                >
                  {claims.length === 0 ? (
                    <option value="">Rol bulunamadı</option>
                  ) : (
                    claims.map(claim => (
                      <option key={claim.id} value={claim.id} style={{ background: '#1e293b', color: '#f8fafc' }}>
                        {claim.name}
                      </option>
                    ))
                  )}
                </select>
                <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94a3b8', display: 'flex' }}>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
                </div>
              </div>
            )}
          </div>

          <button 
            type="submit" 
            disabled={isLoading || isFetchingRoles || claims.length === 0} 
            style={{ 
              width: '100%', 
              padding: '14px', 
              backgroundColor: '#8b5cf6', 
              color: 'white', 
              border: 'none', 
              borderRadius: '10px', 
              fontWeight: 600, 
              fontSize: '1rem',
              cursor: (isLoading || isFetchingRoles || claims.length === 0) ? 'not-allowed' : 'pointer',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              opacity: (isLoading || isFetchingRoles || claims.length === 0) ? 0.7 : 1,
              transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
            }}
            onMouseOver={(e) => { if (!isLoading && !isFetchingRoles && claims.length > 0) e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseOut={(e) => { if (!isLoading && !isFetchingRoles && claims.length > 0) e.currentTarget.style.transform = 'translateY(0)' }}
          >
            {isLoading ? (
              <span style={{ display: 'inline-block', width: '20px', height: '20px', border: '3px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></span>
            ) : (
              'Kaydet'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

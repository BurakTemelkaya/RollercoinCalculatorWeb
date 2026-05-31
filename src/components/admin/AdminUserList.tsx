import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../../contexts/AuthContext';
import { getUserList } from '../../services/userApi';
import { removeRoleFromUser } from '../../services/adminApi';
import { GetUserDto } from '../../types/auth';
import DashboardLayout from '../DashboardLayout';
import Pagination from '../Pagination';
import AssignRoleModal from './AssignRoleModal';

export default function AdminUserList() {
  const { t } = useTranslation();
  const { accessToken } = useAuth();
  
  const [users, setUsers] = useState<GetUserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Assign Role State
  const [selectedUser, setSelectedUser] = useState<GetUserDto | null>(null);
  const [isAssignRoleModalOpen, setIsAssignRoleModalOpen] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [hasNext, setHasNext] = useState(false);
  const pageSize = 10;

  useEffect(() => {
    fetchUsers(currentPage);
  }, [currentPage]);

  const fetchUsers = async (pageIndex: number) => {
    if (!accessToken) return;
    
    setLoading(true);
    try {
      const response = await getUserList({ pageIndex, pageSize }, accessToken);
      setUsers(response.items);
      setTotalPages(response.pages);
      setHasPrevious(response.hasPrevious);
      setHasNext(response.hasNext);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch users:', err);
      setError(err.message || 'Kullanıcılar yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleAssignRoleClick = (user: GetUserDto) => {
    setSelectedUser(user);
    setIsAssignRoleModalOpen(true);
  };

  const handleAssignRoleSuccess = () => {
    // Refresh current page after assigning a role
    fetchUsers(currentPage);
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleRemoveRole = async (userId: string, operationClaimId: string, roleName: string) => {
    if (!accessToken) return;
    
    if (!window.confirm(`Kullanıcıdan "${roleName}" rolünü kaldırmak istediğinize emin misiniz?`)) {
      return;
    }

    try {
      await removeRoleFromUser({ userId, operationClaimId }, accessToken);
      fetchUsers(currentPage);
    } catch (err: any) {
      console.error('Failed to remove role:', err);
      setError(err.message || 'Rol kaldırılırken bir hata oluştu.');
    }
  };

  return (
    <DashboardLayout title={t('admin.manageUsers', 'Kullanıcı Yönetimi')} isAdmin={true}>
      <Helmet>
        <title>{t('admin.manageUsers', 'Kullanıcı Yönetimi')} | Admin | Rollercoin Calculator</title>
      </Helmet>
      
      <div className="admin-content-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
            {t('admin.manageUsers', 'Kullanıcı Yönetimi')}
          </h1>
        </div>

        {error && (
          <div style={{ padding: '16px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: '8px', marginBottom: '24px', border: '1px solid rgba(239,68,68,0.2)' }}>
            {error}
          </div>
        )}
        
        <AssignRoleModal 
          isOpen={isAssignRoleModalOpen} 
          onClose={() => setIsAssignRoleModalOpen(false)} 
          user={selectedUser} 
          onSuccess={handleAssignRoleSuccess} 
        />

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <th style={{ padding: '12px 16px', color: '#94a3b8', fontWeight: 600, fontSize: '0.9rem' }}>İsim</th>
                <th style={{ padding: '12px 16px', color: '#94a3b8', fontWeight: 600, fontSize: '0.9rem' }}>E-posta</th>
                <th style={{ padding: '12px 16px', color: '#94a3b8', fontWeight: 600, fontSize: '0.9rem' }}>Roller</th>
                <th style={{ padding: '12px 16px', color: '#94a3b8', fontWeight: 600, fontSize: '0.9rem' }}>Kayıt Tarihi</th>
                <th style={{ padding: '12px 16px', color: '#94a3b8', fontWeight: 600, fontSize: '0.9rem', textAlign: 'right' }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '48px 16px', color: '#94a3b8' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                      <span className="spinner"></span>
                    </div>
                    Yükleniyor...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '48px 16px', color: '#94a3b8' }}>
                    Kullanıcı bulunamadı.
                  </td>
                </tr>
              ) : (
                users.map(user => (
                  <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 500 }}>{user.name}</td>
                    <td style={{ padding: '12px 16px', color: '#cbd5e1' }}>{user.email}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {user.userOperationClaims && user.userOperationClaims.length > 0 ? (
                          user.userOperationClaims.map(claim => (
                            <span key={claim.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, border: '1px solid rgba(139, 92, 246, 0.3)' }}>
                              {claim.operationClaim.name}
                              <button
                                onClick={() => handleRemoveRole(user.id, claim.operationClaimId, claim.operationClaim.name)}
                                style={{ background: 'transparent', border: 'none', color: '#a78bfa', cursor: 'pointer', padding: '0 2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                title="Rolü Kaldır"
                              >
                                &times;
                              </button>
                            </span>
                          ))
                        ) : (
                          <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Rol Yok</span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#cbd5e1', fontSize: '0.9rem' }}>{formatDate(user.createdDate)}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <button
                        onClick={() => handleAssignRoleClick(user)}
                        style={{
                          background: 'rgba(59, 130, 246, 0.1)',
                          color: '#60a5fa',
                          border: '1px solid rgba(59, 130, 246, 0.2)',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          fontWeight: 500,
                          transition: 'all 0.2s'
                        }}
                      >
                        Rol Ata
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && totalPages > 1 && (
          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center' }}>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              hasPrevious={hasPrevious}
              hasNext={hasNext}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

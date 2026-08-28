import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, LogOut, ChevronDown } from 'lucide-react';
import ChangePasswordModal from './ChangePasswordModal';

const Header = ({ title = 'Dashboard' }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('wcaeo_user') || '{"username":"ihreo_admin","initials":"IH"}');

  const handleLogout = () => {
    localStorage.removeItem('wcaeo_token');
    localStorage.removeItem('wcaeo_user');
    navigate('/login');
  };

  return (
    <>
      <header className="top-header">
        <h1 className="header-title">{title}</h1>
        <div className="header-actions">
          <div className="user-profile" onClick={() => setDropdownOpen(!dropdownOpen)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="user-avatar">{user.initials || 'IH'}</div>
              <span style={{ fontSize: '14px', fontWeight: 600 }}>{user.username}</span>
              <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />
            </div>

            {dropdownOpen && (
              <div className="profile-dropdown" onClick={(e) => e.stopPropagation()}>
                <button
                  className="dropdown-item"
                  onClick={() => {
                    setDropdownOpen(false);
                    setPasswordModalOpen(true);
                  }}
                >
                  <KeyRound size={16} /> Change Password
                </button>
                <button className="dropdown-item logout" onClick={handleLogout}>
                  <LogOut size={16} /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <ChangePasswordModal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
      />
    </>
  );
};

export default Header;

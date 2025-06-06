import React from 'react';
import './Header.css';

const Header = ({ user, onLogout }) => {
  const getRoleDisplayName = (role) => {
    switch(role) {
      case 'admin': return 'Administrador';
      case 'member': return 'Asociado';
      case 'external': return 'Cliente Externo';
      default: return role;
    }
  };

  const getRoleIcon = (role) => {
    switch(role) {
      case 'admin': return '👨‍💼';
      case 'member': return '👤';
      case 'external': return '🌐';
      default: return '👤';
    }
  };

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="header-left">
          <div className="logo">
            <img src="/logo-banquito.jpeg" alt="Banquito Logo" className="logo-image" />
            <span className="logo-text">Banquito</span>
          </div>
        </div>


        <div className="header-right">
          <div className="user-info">
            <span className="user-role-icon">{getRoleIcon(user.role)}</span>
            <div className="user-details">
              <span className="user-name">{user.name}</span>
              <span className="user-role">{getRoleDisplayName(user.role)}</span>
            </div>
          </div>
          
          <button onClick={onLogout} className="logout-btn">
            🚪 Salir
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
import React from 'react';
import { User } from '../../types';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onLogout }) => {
  if (!user) return null;

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-success shadow-sm mb-4">
      <div className="container">
        <a className="navbar-brand fw-bold" href="#">
          <i className="fa-solid fa-leaf me-2"></i> BananTrack
        </a>
        <div className="d-flex align-items-center">
          <span className="text-white me-3 d-none d-sm-inline">
            <i className="fa-solid fa-user-circle me-1"></i> {user.username} 
            <span className="badge bg-light text-success ms-2 small text-uppercase">{user.rol}</span>
          </span>
          <button className="btn btn-outline-light btn-sm" onClick={onLogout}>
            <i className="fa-solid fa-sign-out-alt"></i> Salir
          </button>
        </div>
      </div>
    </nav>
  );
};

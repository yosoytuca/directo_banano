import React, { useState } from 'react';

interface LoginFormProps {
  onLogin: (u: string, p: string) => void;
  onToggleRegister: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin, onToggleRegister }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(username, password);
  };

  return (
    <div id="login-view">
      <form id="login-form" onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Usuario</label>
          <input 
            type="text" 
            className="form-control" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required 
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Contraseña</label>
          <input 
            type="password" 
            className="form-control" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required 
          />
        </div>
        <button type="submit" className="btn btn-success w-100">Ingresar</button>
      </form>
      <div className="mt-3 text-center">
        <button className="btn btn-link text-success p-0" onClick={onToggleRegister}>
          ¿No tienes cuenta? Regístrate
        </button>
      </div>
    </div>
  );
};

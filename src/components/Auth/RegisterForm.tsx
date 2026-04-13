import React, { useState } from 'react';

interface RegisterFormProps {
  onRegister: (u: string, p: string) => Promise<boolean>;
  onToggleLogin: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onRegister, onToggleLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await onRegister(username, password);
    if (success) onToggleLogin();
  };

  return (
    <div id="register-view">
      <form id="register-form" onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Nuevo Usuario</label>
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
        <button type="submit" className="btn btn-success w-100">Registrarse</button>
      </form>
      <div className="mt-3 text-center">
        <button className="btn btn-link text-success p-0" onClick={onToggleLogin}>
          ¿Ya tienes cuenta? Inicia sesión
        </button>
      </div>
    </div>
  );
};

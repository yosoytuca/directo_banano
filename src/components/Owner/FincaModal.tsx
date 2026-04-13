import React, { useState, useEffect, useRef } from 'react';
import { Finca } from '../../types';

interface FincaModalProps {
  show: boolean;
  finca: Finca | null;
  onClose: () => void;
  onSave: () => void;
  token: string;
  showAlert: (m: string, t: string) => void;
  apiUrl: string;
}

export const FincaModal: React.FC<FincaModalProps> = ({ show, finca, onClose, onSave, token, showAlert, apiUrl }) => {
  const [nombre, setNombre] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [hectareas, setHectareas] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (finca) {
      setNombre(finca.nombre);
      setUbicacion(finca.ubicacion);
      setHectareas(finca.hectareas?.toString() || '');
    } else {
      setNombre('');
      setUbicacion('');
      setHectareas('');
    }
  }, [finca]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = finca ? 'PUT' : 'POST';
    const url = finca ? `${apiUrl}/fincas/${finca.id}` : `${apiUrl}/fincas`;

    try {
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nombre,
          ubicacion,
          hectareas: parseFloat(hectareas) || 0
        })
      });

      if (!res.ok) throw new Error('Error al guardar finca');
      
      showAlert(finca ? 'Finca actualizada' : 'Finca registrada', 'success');
      onSave();
      onClose();
    } catch (error: any) {
      showAlert(error.message, 'danger');
    }
  };

  if (!show) return null;

  return (
    <>
      <div className="modal-backdrop fade show"></div>
      <div className="modal fade show d-block" tabIndex={-1} ref={modalRef}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header bg-success text-white">
              <h5 className="modal-title">{finca ? 'Editar Finca' : 'Registrar Nueva Finca'}</h5>
              <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Nombre de la Finca</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required 
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Ubicación</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={ubicacion}
                    onChange={(e) => setUbicacion(e.target.value)}
                    required 
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Hectáreas (Opcional)</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    step="0.1"
                    value={hectareas}
                    onChange={(e) => setHectareas(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn-success w-100">Guardar Finca</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

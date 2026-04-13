import React, { useState, useEffect } from 'react';
import { Finca, ColorConfig } from '../../types';
import { formatDate } from '../../utils/dateUtils';

interface EnfundeFormProps {
  finca: Finca;
  token: string;
  onBack: () => void;
  onSuccess: () => void;
  showAlert: (m: string, t: string) => void;
  apiUrl: string;
}

export const EnfundeForm: React.FC<EnfundeFormProps> = ({ finca, token, onBack, onSuccess, showAlert, apiUrl }) => {
  const [colores, setColores] = useState<ColorConfig[]>([]);
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [cantidad, setCantidad] = useState(100);
  const [modo, setModo] = useState<'diario' | 'semanal'>('diario');

  const getISOWeek = (dateStr: string) => {
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    const week1 = new Date(date.getFullYear(), 0, 4);
    return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  };

  useEffect(() => {
    const fetchColores = async () => {
      try {
        const res = await fetch(`${apiUrl}/configuracion_colores?finca_id=${finca.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        setColores(data);
      } catch (e) {
        console.error('Error fetching colores:', e);
      }
    };
    fetchColores();
  }, [finca.id, token, apiUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedColor) {
      showAlert('Por favor seleccione un color de cinta', 'warning');
      return;
    }
    if (!cantidad || cantidad <= 0) {
      showAlert('La cantidad de racimos debe ser mayor a 0', 'warning');
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/enfunde`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          finca_id: finca.id,
          fecha_registro: fecha,
          cantidad_racimos: cantidad,
          color_cinta: selectedColor,
          tipo_registro: modo
        })
      });

      if (!res.ok) throw new Error('Error al registrar enfunde');
      
      showAlert('Registro de enfunde exitoso', 'success');
      onSuccess();
    } catch (error: any) {
      showAlert(error.message, 'danger');
    }
  };

  return (
    <div className="card shadow-sm border-0">
      <div className="card-header bg-success text-white d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Registrar Enfunde: {finca.nombre}</h5>
        <button className="btn btn-sm btn-light" onClick={onBack}>
          <i className="fa-solid fa-arrow-left"></i> Volver
        </button>
      </div>
      <div className="card-body">
        <div className="btn-group w-100 mb-4" role="group">
          <button 
            type="button" 
            className={`btn ${modo === 'diario' ? 'btn-success' : 'btn-outline-success'}`}
            onClick={() => setModo('diario')}
          >
            <i className="fa-solid fa-calendar-day me-2"></i> Registro Diario
          </button>
          <button 
            type="button" 
            className={`btn ${modo === 'semanal' ? 'btn-success' : 'btn-outline-success'}`}
            onClick={() => setModo('semanal')}
          >
            <i className="fa-solid fa-calendar-week me-2"></i> Registro Semanal
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">
              {modo === 'diario' ? 'Fecha de Registro' : 'Seleccione un día de la semana'}
            </label>
            <input 
              type="date" 
              className="form-control" 
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              required 
            />
            {modo === 'semanal' && (
              <div className="mt-2">
                <span className="badge bg-info text-dark">
                  Corresponde a la Semana {getISOWeek(fecha)} ({formatDate(fecha)})
                </span>
              </div>
            )}
          </div>
          <div className="mb-3">
            <label className="form-label">
              {modo === 'diario' ? 'Cantidad de Racimos a Registrar' : 'Total de Racimos a Registrar (Semana)'}
            </label>
            <input 
              type="number" 
              className="form-control" 
              value={cantidad}
              onChange={(e) => setCantidad(parseInt(e.target.value) || 0)}
              required 
            />
          </div>
          <div className="mb-3">
            <label className="form-label d-block">Color de Cinta</label>
            <div className="d-flex flex-wrap gap-2">
              {colores.map(c => (
                <div 
                  key={c.id}
                  className={`color-badge bg-${c.color_nombre.toLowerCase().replace('é', 'e')} ${selectedColor === c.color_nombre ? 'active ring' : ''}`}
                  onClick={() => setSelectedColor(c.color_nombre)}
                  style={{ 
                    cursor: 'pointer', 
                    padding: '8px 15px', 
                    borderRadius: '20px',
                    border: selectedColor === c.color_nombre ? '2px solid black' : '1px solid #ccc',
                    color: ['Blanco', 'Amarilla'].includes(c.color_nombre) ? 'black' : 'white'
                  }}
                >
                  {c.color_nombre}
                </div>
              ))}
            </div>
          </div>
          <button type="submit" className="btn btn-success w-100 mt-3">
            <i className="fa-solid fa-save me-2"></i> Guardar Registro
          </button>
        </form>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { ProyeccionFecha } from '../../types';
import { formatDate } from '../../utils/dateUtils';

interface ProyeccionViewProps {
  onBack: () => void;
  token: string;
  apiUrl: string;
}

export const ProyeccionView: React.FC<ProyeccionViewProps> = ({ onBack, token, apiUrl }) => {
  const [fecha, setFecha] = useState('');
  const [proyeccion, setProyeccion] = useState<ProyeccionFecha | null>(null);
  const [loading, setLoading] = useState(false);

  const handleConsultar = async () => {
    if (!fecha) return;
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/admin/proyeccion_fecha?fecha=${fecha}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setProyeccion(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="admin-proyeccion-view">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4><i className="fa-solid fa-calendar-check text-info"></i> Planificación de Exportación</h4>
        <button className="btn btn-outline-secondary" onClick={onBack}>
          <i className="fa-solid fa-arrow-left"></i> Volver
        </button>
      </div>

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body bg-light">
          <div className="row g-2 align-items-end">
            <div className="col-md-9">
              <label className="form-label fw-bold">Seleccionar Fecha de Cosecha</label>
              <input 
                type="date" 
                className="form-control" 
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <button className="btn btn-info text-white w-100" onClick={handleConsultar} disabled={loading}>
                <i className="fa-solid fa-filter"></i> {loading ? 'Consultando...' : 'Consultar Plan'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {proyeccion && (
        <div id="plan-result-container">
          <div className="alert alert-info mb-4">
            <i className="fa-solid fa-calendar-day"></i> Cosecha programada para la Semana {proyeccion.semana} (basado en fecha {formatDate(fecha)})
          </div>
          <div id="plan-results-grid" className="row g-3">
            {proyeccion.resultados.length > 0 ? proyeccion.resultados.map((r, idx) => (
              <div key={idx} className="col-md-6 col-lg-4">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body">
                    <h6 className="text-success fw-bold mb-1">{r.finca}</h6>
                    <p className="small text-muted mb-2">Dueño: {r.dueno}</p>
                    <div className="d-flex justify-content-between align-items-center">
                      <span className={`badge bg-${r.color_cinta.toLowerCase().replace('é', 'e')} text-white`}>{r.color_cinta}</span>
                      <span className="h5 mb-0 fw-bold">{r.total} <small className="text-muted" style={{ fontSize: '0.6em' }}>racimos</small></span>
                    </div>
                  </div>
                </div>
              </div>
            )) : (
              <div className="col-12 text-center py-5">
                <div className="text-muted">
                  <i className="fa-solid fa-calendar-xmark fa-3x mb-3"></i>
                  <h5>No hay cosechas programadas para esta fecha</h5>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

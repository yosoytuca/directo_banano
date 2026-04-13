import React, { useState, useEffect } from 'react';
import { DuenoDetalle } from '../../types';

interface DuenosViewProps {
  onBack: () => void;
  token: string;
  apiUrl: string;
}

export const DuenosView: React.FC<DuenosViewProps> = ({ onBack, token, apiUrl }) => {
  const [duenos, setDuenos] = useState<DuenoDetalle[]>([]);
  const [selectedDueno, setSelectedDueno] = useState<DuenoDetalle | null>(null);
  const [duenoFincas, setDuenoFincas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDuenos = async () => {
      try {
        const res = await fetch(`${apiUrl}/admin/duenos`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        setDuenos(data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchDuenos();
  }, [token, apiUrl]);

  const handleSelectDueno = async (d: DuenoDetalle) => {
    setSelectedDueno(d);
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/admin/duenos/${d.id}/fincas`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setDuenoFincas(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (selectedDueno) {
    return (
      <div id="admin-dueno-profile">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h4><i className="fa-solid fa-user text-primary"></i> Perfil: {selectedDueno.username}</h4>
          <button className="btn btn-outline-secondary" onClick={() => setSelectedDueno(null)}>
            <i className="fa-solid fa-arrow-left"></i> Volver a Lista
          </button>
        </div>

        <div className="row mb-4">
          <div className="col-md-4">
            <div className="card shadow-sm border-0 bg-primary text-white">
              <div className="card-body text-center">
                <h6 className="text-uppercase small mb-2">Fincas Registradas</h6>
                <h2 className="mb-0">{selectedDueno.fincas}</h2>
              </div>
            </div>
          </div>
        </div>

        <h5 className="mb-3">Detalle de Fincas</h5>
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
          </div>
        ) : (
          <div className="row g-3">
            {duenoFincas.map((f, idx) => (
              <div key={idx} className="col-md-6">
                <div className="card shadow-sm border-0 h-100">
                  <div className="card-body">
                    <h5 className="card-title text-success">{f.nombre}</h5>
                    <p className="card-text small text-muted mb-2">Ubicación: {f.ubicacion}</p>
                    <div className="row text-center g-2 mb-3">
                      <div className="col-4">
                        <div className="p-2 bg-light rounded">
                          <small className="d-block text-muted">Registrado</small>
                          <span className="fw-bold">{f.total_registrado}</span>
                        </div>
                      </div>
                      <div className="col-4">
                        <div className="p-2 bg-light rounded">
                          <small className="d-block text-muted">Cosechado</small>
                          <span className="fw-bold text-info">{f.total_cosechado}</span>
                        </div>
                      </div>
                      <div className="col-4">
                        <div className="p-2 bg-light rounded">
                          <small className="d-block text-muted">Pendiente</small>
                          <span className="fw-bold text-danger">{f.pendiente}</span>
                        </div>
                      </div>
                    </div>
                    
                    <h6 className="small fw-bold mb-2">Cronograma (Semanas):</h6>
                    <div className="d-flex gap-1 flex-wrap mb-3">
                      {(() => {
                        const weeks = f.proyecciones.filter((p: any) => p.cantidad > 0);
                        return weeks.length > 0 ? weeks.map((p: any, i: number) => (
                          <div 
                            key={i} 
                            className="badge bg-info text-dark" 
                            title={`Semana ${p.semana}: ${p.cantidad} racimos pendientes`}
                            style={{ 
                              width: 'auto', 
                              height: '24px', 
                              borderRadius: '4px', 
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '10px',
                              cursor: 'help'
                            }}
                          >
                            Sem {p.semana}: {p.cantidad}
                          </div>
                        )) : <span className="text-muted small">Sin proyecciones pendientes</span>;
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div id="admin-duenos-view">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4><i className="fa-solid fa-users text-primary"></i> Detalle de Dueños</h4>
        <button className="btn btn-outline-secondary" onClick={onBack}>
          <i className="fa-solid fa-arrow-left"></i> Volver
        </button>
      </div>
      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th>Username</th>
                  <th>Cantidad de Fincas</th>
                  <th className="text-end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {duenos.map((d, idx) => (
                  <tr key={idx}>
                    <td className="fw-bold">{d.username}</td>
                    <td><span className="badge bg-primary">{d.fincas} fincas</span></td>
                    <td className="text-end">
                      <button className="btn btn-sm btn-outline-primary" onClick={() => handleSelectDueno(d)}>
                        <i className="fa-solid fa-eye"></i> Ver Perfil
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

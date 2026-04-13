import React, { useState, useEffect } from 'react';
import { FincaDetalle } from '../../types';

interface FincasViewProps {
  onBack: () => void;
  token: string;
  apiUrl: string;
  onDeleteFinca?: (id: number) => Promise<boolean>;
}

export const FincasView: React.FC<FincasViewProps> = ({ onBack, token, apiUrl, onDeleteFinca }) => {
  const [fincas, setFincas] = useState<FincaDetalle[]>([]);

  const fetchFincas = async () => {
    try {
      const res = await fetch(`${apiUrl}/admin/fincas_detalle`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setFincas(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchFincas();
  }, [token, apiUrl]);

  const handleDelete = async (f: any) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar la finca "${f.finca}" (Dueño: ${f.dueno})? Esta acción es irreversible y borrará todos sus registros.`)) {
      if (onDeleteFinca) {
        const success = await onDeleteFinca(f.id);
        if (success) fetchFincas();
      } else {
        // Fallback si no se pasa la prop
        try {
          const res = await fetch(`${apiUrl}/fincas/${f.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) fetchFincas();
        } catch (e) {
          console.error(e);
        }
      }
    }
  };

  return (
    <div id="admin-fincas-view">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4><i className="fa-solid fa-map-location-dot text-success"></i> Monitoreo de Fincas</h4>
        <button className="btn btn-outline-secondary" onClick={onBack}>
          <i className="fa-solid fa-arrow-left"></i> Volver
        </button>
      </div>
      
      <div id="fincas-detalle-container">
        {fincas.map((f, idx) => (
          <div key={idx} className="card mb-3 border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h5 className="mb-0 text-success">{f.finca}</h5>
                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-light text-dark">Dueño: {f.dueno}</span>
                  <button className="btn btn-sm btn-outline-danger border-0" onClick={() => handleDelete(f)}>
                    <i className="fa-solid fa-trash-can"></i>
                  </button>
                </div>
              </div>
              <div className="d-flex align-items-center mb-3">
                <span className="small text-muted me-3">Cronograma (Semanas):</span>
                <div className="d-flex gap-1 flex-wrap">
                  {(() => {
                    // Agrupar registros de la finca por semana ISO
                    const groupedByWeek: Record<number, { color: string, total: number }> = {};
                    f.registros.forEach(r => {
                      if (!groupedByWeek[r.semana]) {
                        groupedByWeek[r.semana] = { color: r.color, total: 0 };
                      }
                      groupedByWeek[r.semana].total += r.cantidad;
                      // El color será el del último registro procesado (que por el sort de la API suele ser el más reciente o consistente)
                      groupedByWeek[r.semana].color = r.color;
                    });

                    const weeks = Object.keys(groupedByWeek).map(Number).sort((a, b) => a - b);
                    
                    return weeks.length > 0 ? weeks.map((w, i) => (
                      <div 
                        key={i} 
                        className={`color-dot bg-${groupedByWeek[w].color.toLowerCase().replace('é', 'e')}`} 
                        title={`Semana ${w}: ${groupedByWeek[w].total} racimos (${groupedByWeek[w].color})`}
                        style={{ 
                          width: '24px', 
                          height: '24px', 
                          borderRadius: '4px', 
                          border: '1px solid #ddd',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                          color: ['Blanco', 'Amarilla'].includes(groupedByWeek[w].color) ? 'black' : 'white',
                          cursor: 'help'
                        }}
                      >
                        {w}
                      </div>
                    )) : <span className="text-muted small">Sin datos</span>;
                  })()}
                </div>
              </div>
              <div className="row text-center g-2 mb-3">
                <div className="col-4">
                  <div className="p-2 bg-light rounded">
                    <small className="d-block text-muted">Histórico</small>
                    <span className="fw-bold">{f.total_racimos + (f.registros.reduce((s, r) => s + (r.cantidad_cosechada || 0), 0))}</span>
                  </div>
                </div>
                <div className="col-4">
                  <div className="p-2 bg-light rounded">
                    <small className="d-block text-muted">Cosechado</small>
                    <span className="fw-bold text-info">{f.registros.reduce((s, r) => s + (r.cantidad_cosechada || 0), 0)}</span>
                  </div>
                </div>
                <div className="col-4">
                  <div className="p-2 bg-light rounded">
                    <small className="d-block text-muted">Pendiente</small>
                    <span className="fw-bold text-danger">{f.total_racimos}</span>
                  </div>
                </div>
              </div>
              
              <div className="d-flex align-items-center mb-0">
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

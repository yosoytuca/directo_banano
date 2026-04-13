import React, { useState, useEffect } from 'react';
import { Finca } from '../../types';

interface FincaCardProps {
  finca: Finca;
  token: string;
  currentWeek: number;
  onSelect: (f: Finca) => void;
  onEdit: (f: Finca) => void;
  onHistorial: (f: Finca) => void;
  onDelete: (id: number) => void;
  apiUrl: string;
}

export const FincaCard: React.FC<FincaCardProps> = ({ finca, token, currentWeek, onSelect, onEdit, onHistorial, onDelete, apiUrl }) => {
  const [indicator, setIndicator] = useState<React.ReactNode>(<span className="text-muted small">Calculando...</span>);
  const [chronogram, setChronogram] = useState<any[]>([]);

  useEffect(() => {
    const fetchFincaData = async () => {
      try {
        // Fetch last enfunde for indicator
        const resInd = await fetch(`${apiUrl}/fincas/${finca.id}/last_enfunde`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const lastEnfunde = await resInd.json();
        
        if (lastEnfunde) {
          let weeksLeft = lastEnfunde.semana_cosecha_estimada - currentWeek;
          if (weeksLeft < 0) weeksLeft += 52;
          
          if (weeksLeft === 0) {
            setIndicator(<span className="badge bg-cosecha-lista shadow-sm">Cosecha esta semana</span>);
          } else {
            setIndicator(<span className="text-info small fw-bold">Cosecha en {weeksLeft} semanas</span>);
          }
        } else {
          setIndicator(<span className="text-muted small">Sin registros</span>);
        }

        // Fetch historial for chronogram
        const resHist = await fetch(`${apiUrl}/fincas/${finca.id}/historial`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const historial = await resHist.json();
        
        // Group by ISO week
        const groups: Record<number, { color: string, total: number }> = {};
        historial.forEach((r: any) => {
          const week = r.semana_iso || r.semana_enfunde || 0;
          if (!groups[week]) {
            groups[week] = { color: r.color_cinta, total: 0 };
          }
          groups[week].total += (r.cantidad_registrada || 0);
          // Keep the color of the most recent record in that week
          groups[week].color = r.color_cinta;
        });

        const sortedWeeks = Object.keys(groups).map(Number).sort((a, b) => a - b).slice(-8);
        setChronogram(sortedWeeks.map(w => ({ week: w, ...groups[w] })));

      } catch (e) {
        setIndicator(<span className="text-danger small">Error</span>);
      }
    };
    fetchFincaData();
  }, [finca.id, token, currentWeek, apiUrl]);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`¿Estás seguro de que deseas eliminar la finca "${finca.nombre}"? Se borrarán todos sus registros asociados de forma permanente.`)) {
      onDelete(finca.id);
    }
  };

  return (
    <div className="col-md-6 col-lg-4">
      <div className="card h-100 shadow-sm border-0 hover-shadow" style={{ cursor: 'pointer' }} onClick={() => onSelect(finca)}>
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-start mb-2">
            <h5 className="card-title text-success mb-0">{finca.nombre}</h5>
            <div className="btn-group">
              <button 
                className="btn btn-sm btn-link text-muted p-1" 
                onClick={(e) => { e.stopPropagation(); onEdit(finca); }}
                title="Editar finca"
              >
                <i className="fa-solid fa-edit"></i>
              </button>
              <button 
                className="btn btn-sm btn-link text-danger p-1" 
                onClick={handleDelete}
                title="Eliminar finca"
              >
                <i className="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </div>
          <p className="card-text text-muted small mb-3">
            <i className="fa-solid fa-location-dot"></i> {finca.ubicacion || 'Sin ubicación'}
          </p>
          
          <div className="mb-3">
            <div className="d-flex gap-1 flex-wrap">
              {chronogram.map((c, i) => (
                <div 
                  key={i} 
                  className={`color-dot bg-${c.color.toLowerCase().replace('é', 'e')}`} 
                  title={`Semana ${c.week}: ${c.total} racimos (${c.color})`}
                  style={{ 
                    width: '20px', 
                    height: '20px', 
                    borderRadius: '4px', 
                    border: '1px solid #ddd',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '9px',
                    color: ['Blanco', 'Amarilla'].includes(c.color) ? 'black' : 'white',
                    cursor: 'help'
                  }}
                >
                  {c.week}
                </div>
              ))}
              {chronogram.length === 0 && <span className="text-muted x-small">Sin cronograma</span>}
            </div>
          </div>

          <div className="d-flex justify-content-between align-items-center mt-auto">
            <span className="badge bg-light text-dark border">{finca.total_racimos || 0} pendientes</span>
            <div>{indicator}</div>
          </div>
          <div className="mt-3">
            <button 
              className="btn btn-sm btn-outline-primary w-100" 
              onClick={(e) => { e.stopPropagation(); onHistorial(finca); }}
            >
              <i className="fa-solid fa-clock-rotate-left me-1"></i> Ver Historial
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

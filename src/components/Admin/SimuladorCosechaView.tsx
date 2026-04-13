import React, { useState, useMemo } from 'react';
import { RegistroEnfundeDetalle } from '../../types';
import { formatDate } from '../../utils/dateUtils';

interface SimuladorCosechaViewProps {
  onBack: () => void;
  allEnfunde: RegistroEnfundeDetalle[];
}

export const SimuladorCosechaView: React.FC<SimuladorCosechaViewProps> = ({ onBack, allEnfunde }) => {
  console.log('SimuladorCosechaView rendered with', allEnfunde.length, 'records');
  const [fechaReferencia, setFechaReferencia] = useState(new Date().toISOString().split('T')[0]);
  const [semanasCalibre, setSemanasCalibre] = useState(11);

  const getISOWeek = (dateStr: string) => {
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    const week1 = new Date(date.getFullYear(), 0, 4);
    return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  };

  const semanaReferencia = useMemo(() => getISOWeek(fechaReferencia), [fechaReferencia]);

  const resultadoSimulacion = useMemo(() => {
    const lotes: any[] = [];
    let totalGeneral = 0;
    
    allEnfunde.forEach(r => {
      const semanaEnfunde = r.semana_iso || r.semana_enfunde || 0;
      let semanaCosechaProyectada = semanaEnfunde + semanasCalibre;
      
      // Ajustar ciclo 52 semanas
      while (semanaCosechaProyectada > 52) semanaCosechaProyectada -= 52;
      
      if (semanaCosechaProyectada === semanaReferencia) {
        const pendiente = (r.cantidad_registrada || r.cantidad_racimos || 0) - (r.cantidad_cosechada || 0);
        if (pendiente > 0) {
          lotes.push({
            finca: r.finca_nombre,
            dueno: r.dueno_username,
            fecha_registro: r.fecha_registro,
            semana_registro: semanaEnfunde,
            cantidad_proyectada: r.cantidad_registrada || r.cantidad_racimos || 0,
            pendiente: pendiente
          });
          totalGeneral += pendiente;
        }
      }
    });

    return {
      totalGeneral,
      lotes: lotes.sort((a, b) => new Date(b.fecha_registro).getTime() - new Date(a.fecha_registro).getTime())
    };
  }, [allEnfunde, semanasCalibre, semanaReferencia]);

  return (
    <div id="admin-simulador-view">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4><i className="fa-solid fa-boxes-stacked text-warning"></i> Trazabilidad de Cosecha (Calibre)</h4>
        <button className="btn btn-outline-secondary" onClick={onBack}>
          <i className="fa-solid fa-arrow-left"></i> Volver
        </button>
      </div>

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body bg-light">
          <div className="row g-3">
            <div className="col-md-5">
              <label className="form-label fw-bold">Fecha de Referencia (Corte)</label>
              <input 
                type="date" 
                className="form-control" 
                value={fechaReferencia}
                onChange={(e) => setFechaReferencia(e.target.value)}
              />
              <small className="text-muted">Semana de referencia: <strong>{semanaReferencia}</strong> (Corte: {formatDate(fechaReferencia)})</small>
            </div>
            <div className="col-md-4">
              <label className="form-label fw-bold">Semanas de Calibre (Maduración)</label>
              <div className="input-group">
                <input 
                  type="number" 
                  className="form-control" 
                  value={semanasCalibre}
                  onChange={(e) => setSemanasCalibre(parseInt(e.target.value) || 0)}
                  min="1"
                  max="20"
                />
                <span className="input-group-text">semanas</span>
              </div>
            </div>
            <div className="col-md-3 text-md-end d-flex align-items-end justify-content-md-end">
              <div className="p-2 bg-white rounded border w-100 text-center">
                <span className="text-muted small d-block">Total Racimos Listos</span>
                <span className="h3 mb-0 fw-bold text-success">{resultadoSimulacion.totalGeneral}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-header bg-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Desglose de Trazabilidad por Lote (Semana {semanaReferencia})</h5>
          <span className="badge bg-primary">{resultadoSimulacion.lotes.length} Lotes</span>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>Finca</th>
                  <th>Dueño</th>
                  <th>Fecha de Registro [Sem.]</th>
                  <th className="text-end">Cantidad Proyectada</th>
                  <th className="text-end">Saldo Pendiente</th>
                </tr>
              </thead>
              <tbody>
                {resultadoSimulacion.lotes.map((l, idx) => (
                  <tr key={idx}>
                    <td className="fw-bold">{l.finca}</td>
                    <td>{l.dueno}</td>
                    <td>{formatDate(l.fecha_registro)} [Sem. {l.semana_registro}]</td>
                    <td className="text-end">{l.cantidad_proyectada}</td>
                    <td className="text-end text-success fw-bold">{l.pendiente}</td>
                  </tr>
                ))}
                {resultadoSimulacion.lotes.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-5 text-muted">
                      <i className="fa-solid fa-circle-info fa-2x mb-2 d-block"></i>
                      No hay lotes proyectados para la Semana {semanaReferencia} con {semanasCalibre} semanas de calibre.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

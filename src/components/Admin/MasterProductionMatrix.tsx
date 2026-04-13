import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface MasterProductionMatrixProps {
  allEnfunde: any[];
  currentWeek: number;
  onRefresh?: () => void;
}

type FilterType = 'General' | 'Enfunde' | 'Cosecha';

export const MasterProductionMatrix: React.FC<MasterProductionMatrixProps> = ({ allEnfunde = [], currentWeek, onRefresh }) => {
  const [startWeek, setStartWeek] = useState(currentWeek);
  const [filter, setFilter] = useState<FilterType>('General');
  const [hideEmpty, setHideEmpty] = useState(true);

  const getColorStyles = (colorName: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      'Lila': { bg: '#c8a2c8', text: '#ffffff' },
      'Blanco': { bg: '#ffffff', text: '#000000' },
      'Verde': { bg: '#28a745', text: '#ffffff' },
      'Azul': { bg: '#007bff', text: '#ffffff' },
      'Roja': { bg: '#dc3545', text: '#ffffff' },
      'Amarilla': { bg: '#ffc107', text: '#000000' },
      'Café': { bg: '#6f4e37', text: '#ffffff' },
      'Cafe': { bg: '#6f4e37', text: '#ffffff' },
      'Negro': { bg: '#000000', text: '#ffffff' },
      'Gris': { bg: '#6c757d', text: '#ffffff' }
    };
    return colors[colorName] || colors['Gris'];
  };

  // Generar rango de 6 semanas desde startWeek
  const weeksRange = useMemo(() => {
    const range = [];
    for (let i = 0; i < 6; i++) {
      let w = startWeek + i;
      while (w > 52) w -= 52;
      while (w < 1) w += 52;
      range.push(w);
    }
    return range;
  }, [startWeek]);

  const handlePrevWeek = () => {
    setStartWeek(prev => {
      let next = prev - 1;
      return next < 1 ? 52 : next;
    });
  };

  const handleNextWeek = () => {
    setStartWeek(prev => {
      let next = prev + 1;
      return next > 52 ? 1 : next;
    });
  };

  // Procesar datos para la matriz (Dos filas por finca: Registro y Cosecha)
  const matrixData = useMemo(() => {
    console.log('MasterProductionMatrix: Procesando datos...', allEnfunde?.length);
    if (!Array.isArray(allEnfunde)) return [];
    const farms: Record<string, any> = {};

    allEnfunde.forEach(r => {
      if (!r || !r.finca_id) return;
      const fincaKey = `${r.finca_id}`;
      if (!farms[fincaKey]) {
        farms[fincaKey] = {
          id: r.finca_id,
          nombre: r.finca_nombre || 'Finca sin nombre',
          dueno: r.dueno_username || 'Dueño desconocido',
          enfundeByWeek: {},
          cosechaByWeek: {}
        };
      }

      const enfundeWeek = r.semana_iso;
      const harvestWeek = r.semana_cosecha_estimada;
      const registrado = (r.cantidad_registrada || r.cantidad_racimos || 0);
      const cosechado = (r.cantidad_cosechada || 0);
      const pendiente = registrado - cosechado;

      // Mapear a semana de registro (Enfunde)
      if (weeksRange.includes(enfundeWeek) && registrado > 0) {
        if (!farms[fincaKey].enfundeByWeek[enfundeWeek]) {
          farms[fincaKey].enfundeByWeek[enfundeWeek] = { cantidad: 0, color: r.color_cinta };
        }
        farms[fincaKey].enfundeByWeek[enfundeWeek].cantidad += registrado;
      }

      // Mapear a semana de cosecha (Cosecha)
      if (weeksRange.includes(harvestWeek)) {
        if (!farms[fincaKey].cosechaByWeek[harvestWeek]) {
          farms[fincaKey].cosechaByWeek[harvestWeek] = { cantidad: 0, color: r.color_cinta };
        }
        farms[fincaKey].cosechaByWeek[harvestWeek].cantidad += pendiente;
      }
    });

    let farmList = Object.values(farms);
    if (hideEmpty) {
      farmList = farmList.filter(f => {
        const hasEnfunde = filter !== 'Cosecha' && weeksRange.some(w => f.enfundeByWeek[w]?.cantidad > 0);
        const hasCosecha = filter !== 'Enfunde' && weeksRange.some(w => f.cosechaByWeek[w]?.cantidad > 0);
        return hasEnfunde || hasCosecha;
      });
    }

    return farmList;
  }, [allEnfunde, weeksRange, hideEmpty, filter]);

  // Calcular totales por semana y tipo
  const weeklyTotals = useMemo(() => {
    const totals: Record<number, { enfunde: number; cosecha: number }> = {};
    weeksRange.forEach(w => {
      totals[w] = {
        enfunde: filter !== 'Cosecha' ? matrixData.reduce((sum, f) => sum + (f.enfundeByWeek[w]?.cantidad || 0), 0) : 0,
        cosecha: filter !== 'Enfunde' ? matrixData.reduce((sum, f) => sum + (f.cosechaByWeek[w]?.cantidad || 0), 0) : 0
      };
    });
    return totals;
  }, [matrixData, weeksRange, filter]);

  return (
    <div className="card shadow-sm border-0 mb-4" id="master-production-matrix">
      <div className="card-header bg-white py-3 border-bottom-0">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <h5 className="mb-0 fw-bold text-dark">
            <i className="fa-solid fa-calendar-days me-2 text-primary"></i>
            Matriz de Control Maestro
          </h5>
          
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <div className="btn-group btn-group-sm shadow-sm me-2">
              {(['General', 'Enfunde', 'Cosecha'] as FilterType[]).map(f => (
                <button
                  key={f}
                  className={`btn ${filter === f ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setFilter(f)}
                >
                  {f === 'General' ? 'Vista General' : f === 'Enfunde' ? 'Solo Enfunde' : 'Solo Cosecha'}
                </button>
              ))}
            </div>

            <div className="d-flex align-items-center bg-light rounded border px-2 py-1 shadow-sm me-2">
              <button className="btn btn-sm btn-link text-decoration-none px-2" onClick={handlePrevWeek}>
                <i className="fa-solid fa-chevron-left"></i>
              </button>
              <div className="mx-2 d-flex align-items-center">
                <span className="small text-muted me-2">Semana Inicial:</span>
                <select 
                  className="form-select form-select-sm border-0 bg-transparent fw-bold text-primary p-0" 
                  style={{ width: 'auto', boxShadow: 'none' }}
                  value={startWeek}
                  onChange={(e) => setStartWeek(parseInt(e.target.value))}
                >
                  {Array.from({ length: 52 }, (_, i) => i + 1).map(w => (
                    <option key={w} value={w}>Sem. {w}</option>
                  ))}
                </select>
              </div>
              <button className="btn btn-sm btn-link text-decoration-none px-2" onClick={handleNextWeek}>
                <i className="fa-solid fa-chevron-right"></i>
              </button>
            </div>

            {onRefresh && (
              <button 
                className="btn btn-sm btn-outline-secondary shadow-sm me-2" 
                onClick={onRefresh}
                title="Sincronizar datos"
              >
                <i className="fa-solid fa-sync"></i>
              </button>
            )}
            
            <div className="form-check form-switch bg-light px-3 py-1 rounded border shadow-sm">
              <input 
                className="form-check-input" 
                type="checkbox" 
                id="hideEmptySwitch" 
                checked={hideEmpty}
                onChange={(e) => setHideEmpty(e.target.checked)}
              />
              <label className="form-check-label small text-muted fw-medium" htmlFor="hideEmptySwitch">
                Ocultar vacíos
              </label>
            </div>
          </div>
        </div>
      </div>
      
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-bordered align-middle mb-0" style={{ minWidth: '900px' }}>
            <thead className="table-light">
              <tr>
                <th className="ps-4" style={{ width: '250px', backgroundColor: '#f8f9fa' }}>Finca / Dueño</th>
                {weeksRange.map(w => (
                  <th key={w} className="text-center py-2" style={{ backgroundColor: w === currentWeek ? '#e7f1ff' : '#f8f9fa' }}>
                    <div className="small text-muted text-uppercase fw-bold" style={{ fontSize: '9px' }}>Semana</div>
                    <div className={`fs-5 ${w === currentWeek ? 'text-primary fw-bold' : ''}`}>{w}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {matrixData.map((f) => (
                  <React.Fragment key={f.id}>
                    {filter !== 'Cosecha' && (
                      <motion.tr 
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="border-top-2"
                        style={{ backgroundColor: filter === 'General' ? 'rgba(78, 115, 223, 0.02)' : 'transparent' }}
                      >
                        <td rowSpan={filter === 'General' ? 2 : 1} className="ps-4 py-3 align-middle bg-white border-end">
                          <div className="fw-bold text-dark">{f.nombre}</div>
                          <div className="small text-muted" style={{ fontSize: '11px' }}>
                            ({f.dueno})
                          </div>
                          {filter === 'General' && (
                            <div className="mt-1" style={{ fontSize: '9px' }}>
                              <span className="badge bg-primary-subtle text-primary border-0 p-1 px-2">REGISTRO</span>
                            </div>
                          )}
                        </td>
                        {weeksRange.map(w => (
                          <td key={w} className="text-center py-2" style={{ height: '60px' }}>
                            {f.enfundeByWeek[w] ? (
                              <div className="animate-in zoom-in duration-300 d-flex justify-content-center align-items-center h-100">
                                <div 
                                  className="rounded-pill px-3 py-1 fw-bold shadow"
                                  style={{ 
                                    backgroundColor: getColorStyles(f.enfundeByWeek[w].color).bg,
                                    color: getColorStyles(f.enfundeByWeek[w].color).text,
                                    fontSize: '14px',
                                    minWidth: '55px',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                >
                                  {f.enfundeByWeek[w].cantidad}
                                </div>
                              </div>
                            ) : '-'}
                          </td>
                        ))}
                      </motion.tr>
                    )}
                    {filter !== 'Enfunde' && (
                      <motion.tr 
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{ backgroundColor: filter === 'General' ? 'rgba(28, 200, 138, 0.02)' : 'transparent' }}
                      >
                        {filter === 'Cosecha' && (
                          <td className="ps-4 py-3 align-middle bg-white border-end">
                            <div className="fw-bold text-dark">{f.nombre}</div>
                            <div className="small text-muted" style={{ fontSize: '11px' }}>
                              ({f.dueno})
                            </div>
                          </td>
                        )}
                        {weeksRange.map(w => (
                          <td key={w} className="text-center py-2" style={{ height: '60px' }}>
                            {f.cosechaByWeek[w] ? (
                              <div className="animate-in zoom-in duration-300 d-flex justify-content-center align-items-center h-100">
                                {f.cosechaByWeek[w].cantidad <= 0 ? (
                                  <i className="fa-solid fa-check-circle text-success fs-4"></i>
                                ) : (
                                  <div 
                                    className="rounded-pill px-3 py-1 fw-bold shadow"
                                    style={{ 
                                      backgroundColor: getColorStyles(f.cosechaByWeek[w].color).bg,
                                      color: getColorStyles(f.cosechaByWeek[w].color).text,
                                      fontSize: '14px',
                                      minWidth: '55px',
                                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center'
                                    }}
                                  >
                                    {f.cosechaByWeek[w].cantidad}
                                  </div>
                                )}
                              </div>
                            ) : '-'}
                          </td>
                        ))}
                      </motion.tr>
                    )}
                  </React.Fragment>
                ))}
              </AnimatePresence>
              
              {matrixData.length === 0 && (
                <tr>
                  <td colSpan={weeksRange.length + 2} className="text-center py-5 text-muted">
                    <div className="py-4">
                      <i className="fa-solid fa-calendar-xmark fa-3x mb-3 opacity-25"></i>
                      <p className="mb-0">No hay actividad proyectada para este rango de semanas.</p>
                      <small>Prueba navegando a otras semanas o desactiva "Ocultar vacíos".</small>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot className="table-light fw-bold border-top-2">
              {filter !== 'Cosecha' && (
                <tr>
                  <td className="ps-4 py-2 text-uppercase small text-muted">TOTAL REGISTRO</td>
                  {weeksRange.map(w => (
                    <td key={w} className="text-center text-primary py-2">
                      {weeklyTotals[w].enfunde}
                    </td>
                  ))}
                </tr>
              )}
              {filter !== 'Enfunde' && (
                <tr>
                  <td className="ps-4 py-2 text-uppercase small text-success">TOTAL COSECHA</td>
                  {weeksRange.map(w => (
                    <td key={w} className="text-center text-danger py-2">
                      {weeklyTotals[w].cosecha}
                    </td>
                  ))}
                </tr>
              )}
            </tfoot>
          </table>
        </div>
      </div>
      
      <div className="card-footer bg-white py-3 border-top-0">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 small text-muted">
          <div className="d-flex align-items-center">
            <i className="fa-solid fa-clock-rotate-left me-2 text-info"></i>
            <span>Sincronización total: Mostrando datos históricos y proyecciones futuras.</span>
          </div>
          <div className="d-flex gap-3">
            <span className="badge bg-primary-subtle text-primary border border-primary-subtle">REGISTRO = Enfunde Realizado</span>
            <span className="badge bg-success-subtle text-success border border-success-subtle">COSECHA = Saldo Pendiente</span>
          </div>
        </div>
      </div>
    </div>
  );
};

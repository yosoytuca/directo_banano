import React, { useState, useEffect, useMemo } from 'react';
import { Finca, RegistroEnfunde } from '../../types';
import { formatDate } from '../../utils/dateUtils';

interface FincaHistorialProps {
  finca: Finca;
  onBack: () => void;
  fetchHistorial: (id: number) => Promise<RegistroEnfunde[]>;
  updateCosecha: (id: number, cantidad: number) => Promise<boolean>;
  deleteEnfunde: (id: number) => Promise<boolean>;
}

export const FincaHistorial: React.FC<FincaHistorialProps> = ({ finca, onBack, fetchHistorial, updateCosecha, deleteEnfunde }) => {
  const [historial, setHistorial] = useState<RegistroEnfunde[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchHistorial(finca.id);
    setHistorial(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [finca.id]);

  // Agrupar registros por semana ISO
  const groupedHistorial = useMemo(() => {
    const groups: Record<number, {
      semana: number;
      registros: RegistroEnfunde[];
      total_registrado: number;
      total_cosechado: number;
      color_cinta: string;
      semana_cosecha_estimada: number;
      fecha_representativa: string;
    }> = {};

    historial.forEach(r => {
      const week = r.semana_iso || r.semana_enfunde || 0;
      if (!groups[week]) {
        groups[week] = {
          semana: week,
          registros: [],
          total_registrado: 0,
          total_cosechado: 0,
          color_cinta: r.color_cinta,
          semana_cosecha_estimada: r.semana_cosecha_estimada,
          fecha_representativa: r.fecha_registro
        };
      }
      groups[week].registros.push(r);
      groups[week].total_registrado += (r.cantidad_registrada || 0);
      groups[week].total_cosechado += (r.cantidad_cosechada || 0);
    });

    return Object.values(groups).sort((a, b) => b.semana - a.semana);
  }, [historial]);

  const handleSaveCosecha = async (week: number, registros: RegistroEnfunde[]) => {
    // Para simplificar, si hay varios registros en la semana, repartimos la cosecha proporcionalmente
    // o simplemente actualizamos el primero si es una edición simple.
    // Pero el requerimiento dice "una sola fila". 
    // Si el usuario edita la cosecha de la semana, lo ideal sería actualizar los registros individuales.
    // Por simplicidad en este MVP, actualizaremos el primer registro del grupo con el total.
    if (registros.length > 0) {
      const success = await updateCosecha(registros[0].id, editValue);
      if (success) {
        setEditingId(null);
        loadData();
      }
    }
  };

  const handleDeleteGroup = async (registros: RegistroEnfunde[]) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar los ${registros.length} registros de esta semana? Esta acción no se puede deshacer.`)) {
      setLoading(true);
      try {
        for (const r of registros) {
          await deleteEnfunde(r.id);
        }
        // Actualización local inmediata del estado
        const idsToDelete = registros.map(r => r.id);
        setHistorial(prev => prev.filter(h => !idsToDelete.includes(h.id)));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="card shadow-sm border-0">
      <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Historial de Inventario: {finca.nombre}</h5>
        <button className="btn btn-sm btn-light" onClick={onBack}>
          <i className="fa-solid fa-arrow-left"></i> Volver
        </button>
      </div>
      <div className="card-body">
        <div className="alert alert-info border-0 shadow-sm mb-4">
          <h6 className="mb-1"><i className="fa-solid fa-user-tie me-2"></i> Información del Dueño</h6>
          <p className="mb-0 small">Finca: <strong>{finca.nombre}</strong> | Ubicación: <strong>{finca.ubicacion}</strong></p>
        </div>
        
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>Semana Enfunde</th>
                  <th>Color Cinta</th>
                  <th className="text-center">Cant. Registrada</th>
                  <th className="text-center">Cant. Cosechada</th>
                  <th className="text-center">Saldo Pendiente</th>
                  <th className="text-center">Semana Estimada Cosecha</th>
                  <th className="text-end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {groupedHistorial.map((g) => {
                  const pendiente = g.total_registrado - g.total_cosechado;
                  const isEditing = editingId === g.semana;
                  return (
                    <tr key={g.semana}>
                      <td>
                        <div className="fw-bold">Semana {g.semana}</div>
                        <small className="text-muted">{g.registros.length} registros</small>
                      </td>
                      <td>
                        <span className={`badge bg-${g.color_cinta.toLowerCase().replace('é', 'e')} border text-${['Blanco', 'Amarilla'].includes(g.color_cinta) ? 'dark' : 'white'}`}>
                          {g.color_cinta}
                        </span>
                      </td>
                      <td className="text-center fw-bold">{g.total_registrado}</td>
                      <td className="text-center">
                        {isEditing ? (
                          <input 
                            type="number" 
                            className="form-control form-control-sm d-inline-block" 
                            style={{ width: '80px' }}
                            value={editValue}
                            onChange={(e) => setEditValue(parseInt(e.target.value) || 0)}
                          />
                        ) : (
                          g.total_cosechado
                        )}
                      </td>
                      <td className={`text-center fw-bold ${pendiente > 0 ? 'text-danger' : 'text-success'}`}>
                        {pendiente}
                      </td>
                      <td className="text-center">
                        <span className="badge bg-info text-dark">Semana {g.semana_cosecha_estimada}</span>
                      </td>
                      <td className="text-end">
                        {isEditing ? (
                          <div className="btn-group">
                            <button className="btn btn-sm btn-success" onClick={() => handleSaveCosecha(g.semana, g.registros)}>
                              <i className="fa-solid fa-check"></i>
                            </button>
                            <button className="btn btn-sm btn-danger" onClick={() => setEditingId(null)}>
                              <i className="fa-solid fa-xmark"></i>
                            </button>
                          </div>
                        ) : (
                          <div className="btn-group">
                            <button 
                              className="btn btn-sm btn-outline-primary" 
                              onClick={() => {
                                setEditingId(g.semana);
                                setEditValue(g.total_cosechado || 0);
                              }}
                            >
                              <i className="fa-solid fa-pen-to-square"></i> Cosechar
                            </button>
                            <button 
                              className="btn btn-sm btn-outline-danger" 
                              onClick={() => handleDeleteGroup(g.registros)}
                              title="Eliminar registros de la semana"
                            >
                              <i className="fa-solid fa-trash"></i>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {groupedHistorial.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-4 text-muted">No hay registros para esta finca</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

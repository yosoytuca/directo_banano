import React, { useState, useEffect } from 'react';
import { AdminStats } from '../../types';
import { DuenosView } from './DuenosView';
import { FincasView } from './FincasView';
import { ProyeccionView } from './ProyeccionView';
import { SimuladorCosechaView } from './SimuladorCosechaView';
import { MasterProductionMatrix } from './MasterProductionMatrix';

interface AdminDashboardProps {
  stats: AdminStats | null;
  dashboardData: any[];
  allEnfunde: any[];
  token: string;
  apiUrl: string;
  onRefresh: () => void;
  onDeleteFinca?: (id: number) => Promise<boolean>;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ stats, dashboardData, allEnfunde, token, apiUrl, onRefresh, onDeleteFinca }) => {
  const [view, setView] = useState<'none' | 'duenos' | 'fincas' | 'proyeccion' | 'simulador' | 'matriz'>('none');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [view]);

  const getISOWeek = (dateStr: string) => {
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    const week1 = new Date(date.getFullYear(), 0, 4);
    return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  };

  const currentWeek = getISOWeek(new Date().toISOString());

  const renderContent = () => {
    switch (view) {
      case 'duenos': 
        return (
          <div className="animate-in slide-in-from-right duration-300">
            <div className="mb-3">
              <button className="btn btn-link text-dark text-decoration-none fw-bold p-0" onClick={() => setView('none')}>
                <i className="fa-solid fa-arrow-left me-2"></i> Volver al Menú
              </button>
            </div>
            <DuenosView onBack={() => setView('none')} token={token} apiUrl={apiUrl} />
          </div>
        );
      case 'fincas': 
        return (
          <div className="animate-in slide-in-from-right duration-300">
            <div className="mb-3">
              <button className="btn btn-link text-dark text-decoration-none fw-bold p-0" onClick={() => setView('none')}>
                <i className="fa-solid fa-arrow-left me-2"></i> Volver al Menú
              </button>
            </div>
            <FincasView onBack={() => setView('none')} token={token} apiUrl={apiUrl} onDeleteFinca={onDeleteFinca} />
          </div>
        );
      case 'proyeccion': 
        return (
          <div className="animate-in slide-in-from-right duration-300">
            <div className="mb-3">
              <button className="btn btn-link text-dark text-decoration-none fw-bold p-0" onClick={() => setView('none')}>
                <i className="fa-solid fa-arrow-left me-2"></i> Volver al Menú
              </button>
            </div>
            <ProyeccionView onBack={() => setView('none')} token={token} apiUrl={apiUrl} />
          </div>
        );
      case 'simulador': 
        return (
          <div className="animate-in slide-in-from-right duration-300">
            <div className="mb-3">
              <button className="btn btn-link text-dark text-decoration-none fw-bold p-0" onClick={() => setView('none')}>
                <i className="fa-solid fa-arrow-left me-2"></i> Volver al Menú
              </button>
            </div>
            <SimuladorCosechaView onBack={() => setView('none')} allEnfunde={allEnfunde} />
          </div>
        );
      case 'matriz': 
        return (
          <div className="animate-in slide-in-from-right duration-300">
            <div className="mb-3">
              <button className="btn btn-link text-dark text-decoration-none fw-bold p-0" onClick={() => setView('none')}>
                <i className="fa-solid fa-arrow-left me-2"></i> Volver al Menú
              </button>
            </div>
            <MasterProductionMatrix allEnfunde={allEnfunde} currentWeek={currentWeek} onRefresh={onRefresh} />
          </div>
        );
      default:
        return (
          <div className="d-flex flex-column gap-3 mt-4 animate-in fade-in duration-500">
            <div 
              className="card shadow-sm border-0 text-white clickable-card" 
              style={{ backgroundColor: '#4e73df', minHeight: '120px' }}
              onClick={() => setView('duenos')}
            >
              <div className="card-body d-flex flex-column justify-content-center align-items-center p-4">
                <i className="fa-solid fa-users fa-2x mb-2"></i>
                <h5 className="text-uppercase fw-bold mb-1">Gestión de Dueños</h5>
                <div className="fs-4 fw-bold">{stats?.totalDuenos || 0} Registrados</div>
              </div>
            </div>

            <div 
              className="card shadow-sm border-0 text-white clickable-card" 
              style={{ backgroundColor: '#1cc88a', minHeight: '120px' }}
              onClick={() => setView('fincas')}
            >
              <div className="card-body d-flex flex-column justify-content-center align-items-center p-4">
                <i className="fa-solid fa-map-location-dot fa-2x mb-2"></i>
                <h5 className="text-uppercase fw-bold mb-1">Control de Fincas</h5>
                <div className="fs-4 fw-bold">{stats?.totalFincas || 0} Activas</div>
              </div>
            </div>

            <div 
              className="card shadow-sm border-0 text-white clickable-card" 
              style={{ backgroundColor: '#36b9cc', minHeight: '120px' }}
              onClick={() => setView('proyeccion')}
            >
              <div className="card-body d-flex flex-column justify-content-center align-items-center p-4">
                <i className="fa-solid fa-calendar-check fa-2x mb-2"></i>
                <h5 className="text-uppercase fw-bold mb-1">Planificación por Fecha</h5>
                <div className="fs-4 fw-bold"><i className="fa-solid fa-magnifying-glass-chart"></i></div>
              </div>
            </div>

            <div 
              className="card shadow-sm border-0 text-dark clickable-card" 
              style={{ backgroundColor: '#f6c23e', minHeight: '120px' }}
              onClick={() => setView('simulador')}
            >
              <div className="card-body d-flex flex-column justify-content-center align-items-center p-4">
                <i className="fa-solid fa-flask fa-2x mb-2"></i>
                <h5 className="text-uppercase fw-bold mb-1">Simulador de Cosecha</h5>
                <div className="fs-4 fw-bold"><i className="fa-solid fa-calculator"></i></div>
              </div>
            </div>

            <div 
              className="card shadow-sm border-0 text-white clickable-card" 
              style={{ backgroundColor: '#5a5c69', minHeight: '120px' }}
              onClick={() => setView('matriz')}
            >
              <div className="card-body d-flex flex-column justify-content-center align-items-center p-4">
                <i className="fa-solid fa-table-cells fa-2x mb-2"></i>
                <h5 className="text-uppercase fw-bold mb-1">Matriz de Control Maestro</h5>
                <div className="fs-4 fw-bold"><i className="fa-solid fa-calendar-days"></i></div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div id="admin-dashboard-view" className="container-fluid px-0">
      {renderContent()}
    </div>
  );
};

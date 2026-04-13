import React, { useState } from 'react';
import { useBananTrack } from './hooks/useBananTrack';
import { Navbar } from './components/Shared/Navbar';
import { Alert } from './components/Shared/Alert';
import { LoginForm } from './components/Auth/LoginForm';
import { RegisterForm } from './components/Auth/RegisterForm';
import { FincaList } from './components/Owner/FincaList';
import { EnfundeForm } from './components/Owner/EnfundeForm';
import { FincaModal } from './components/Owner/FincaModal';
import { FincaHistorial } from './components/Owner/FincaHistorial';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { Finca } from './types';

const App: React.FC = () => {
  const {
    user,
    token,
    fincas,
    selectedFinca,
    setSelectedFinca,
    adminStats,
    dashboardData,
    allEnfunde,
    alert,
    login,
    register,
    logout,
    fetchFincas,
    fetchDashboard,
    fetchAdminStats,
    fetchAllEnfunde,
    getISOWeek,
    showAlert,
    updateCosecha,
    fetchHistorial,
    deleteEnfunde,
    deleteFinca,
    refreshAll,
    API_URL
  } = useBananTrack();

  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [showFincaModal, setShowFincaModal] = useState(false);
  const [editingFinca, setEditingFinca] = useState<Finca | null>(null);
  const [historialFinca, setHistorialFinca] = useState<Finca | null>(null);

  const handleEditFinca = (f: Finca) => {
    setEditingFinca(f);
    setShowFincaModal(true);
  };

  const handleAddFinca = () => {
    setEditingFinca(null);
    setShowFincaModal(true);
  };

  if (!token || !user) {
    return (
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-5">
            {alert && <Alert message={alert.message} type={alert.type} />}
            <div className="card shadow border-0">
              <div className="card-body p-4">
                <h3 className="card-title text-center mb-4 text-success">
                  <i className="fa-solid fa-leaf"></i> CODSITO
                </h3>
                {authView === 'login' ? (
                  <LoginForm onLogin={login} onToggleRegister={() => setAuthView('register')} />
                ) : (
                  <RegisterForm onRegister={register} onToggleLogin={() => setAuthView('login')} />
                )}
                <div className="mt-3 text-muted small text-center">
                  Demo: admin/admin123 o dueno/dueno123
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-light min-vh-100">
      <Navbar user={user} onLogout={logout} />
      
      <div className="container pb-5">
        {alert && <Alert message={alert.message} type={alert.type} />}

        {user.rol === 'dueno' ? (
          <div id="view-dueno">
            {historialFinca ? (
              <FincaHistorial 
                finca={historialFinca} 
                onBack={() => setHistorialFinca(null)}
                fetchHistorial={fetchHistorial}
                updateCosecha={updateCosecha}
                deleteEnfunde={deleteEnfunde}
              />
            ) : selectedFinca ? (
              <EnfundeForm 
                finca={selectedFinca} 
                token={token} 
                onBack={() => setSelectedFinca(null)}
                onSuccess={() => { setSelectedFinca(null); fetchFincas(); }}
                showAlert={showAlert}
                apiUrl={API_URL}
              />
            ) : (
              <>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h4 className="text-success fw-bold mb-0">Mis Fincas</h4>
                  <button className="btn btn-success shadow-sm" onClick={handleAddFinca}>
                    <i className="fa-solid fa-plus"></i> Nueva Finca
                  </button>
                </div>
                <FincaList 
                  fincas={fincas} 
                  token={token} 
                  currentWeek={getISOWeek(new Date().toISOString())}
                  onSelectFinca={setSelectedFinca}
                  onEditFinca={handleEditFinca}
                  onHistorial={setHistorialFinca}
                  onDeleteFinca={deleteFinca}
                  onAddFinca={handleAddFinca}
                  apiUrl={API_URL}
                />
              </>
            )}
            
            <FincaModal 
              show={showFincaModal}
              finca={editingFinca}
              onClose={() => setShowFincaModal(false)}
              onSave={fetchFincas}
              token={token}
              showAlert={showAlert}
              apiUrl={API_URL}
            />
          </div>
        ) : (
          <AdminDashboard 
            stats={adminStats} 
            dashboardData={dashboardData} 
            allEnfunde={allEnfunde}
            token={token}
            apiUrl={API_URL}
            onRefresh={refreshAll}
            onDeleteFinca={deleteFinca}
          />
        )}
      </div>
    </div>
  );
};

export default App;

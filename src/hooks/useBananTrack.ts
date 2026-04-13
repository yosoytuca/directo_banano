import { useState, useEffect, useCallback } from 'react';
import { User, Finca, RegistroEnfunde, AdminStats, DuenoDetalle, FincaDetalle, ProyeccionFecha } from '../types';

const API_URL = '/api';

export const useBananTrack = () => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [fincas, setFincas] = useState<Finca[]>([]);
  const [selectedFinca, setSelectedFinca] = useState<Finca | null>(null);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [dashboardData, setDashboardData] = useState<any[]>([]);
  const [allEnfunde, setAllEnfunde] = useState<any[]>([]);
  const [alert, setAlert] = useState<{ message: string; type: string } | null>(null);

  const showAlert = (message: string, type: string = 'info') => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 5000);
  };

  const login = async (username: string, password: string) => {
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error de login');
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      showAlert('Bienvenido al sistema', 'success');
    } catch (error: any) {
      showAlert(error.message, 'danger');
    }
  };

  const register = async (username: string, password: string) => {
    try {
      const res = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error de registro');
      showAlert('Registro exitoso. Ahora puedes iniciar sesión.', 'success');
      return true;
    } catch (error: any) {
      showAlert(error.message, 'danger');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setFincas([]);
    setSelectedFinca(null);
  };

  const fetchFincas = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/fincas`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      setFincas(data);
    } catch (error) {
      console.error('Error fetching fincas:', error);
    }
  }, [token]);

  const fetchAdminStats = useCallback(async () => {
    if (!token || user?.rol !== 'admin') return;
    try {
      const res = await fetch(`${API_URL}/admin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      setAdminStats(data);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    }
  }, [token, user]);

  const fetchDashboard = useCallback(async () => {
    if (!token || user?.rol !== 'admin') return;
    try {
      const res = await fetch(`${API_URL}/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      setDashboardData(data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    }
  }, [token, user]);

  const fetchAllEnfunde = useCallback(async () => {
    if (!token || user?.rol !== 'admin') return;
    try {
      const res = await fetch(`${API_URL}/admin/all_enfunde`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      setAllEnfunde(data);
    } catch (error) {
      console.error('Error fetching all enfunde:', error);
    }
  }, [token, user]);

  const refreshAll = useCallback(async () => {
    if (!token) return;
    if (user?.rol === 'dueno') {
      await fetchFincas();
    } else if (user?.rol === 'admin') {
      await Promise.all([
        fetchAdminStats(),
        fetchDashboard(),
        fetchAllEnfunde()
      ]);
    }
  }, [token, user, fetchFincas, fetchAdminStats, fetchDashboard, fetchAllEnfunde]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  useEffect(() => {
    if (token && user) {
      refreshAll();
    }
  }, [token, user, refreshAll]);

  // Polling para Admin (Tiempo Real)
  useEffect(() => {
    let interval: any;
    if (token && user?.rol === 'admin') {
      interval = setInterval(() => {
        refreshAll();
      }, 30000); // Cada 30 segundos
    }
    return () => clearInterval(interval);
  }, [token, user, refreshAll]);

  // Funciones de utilidad para fechas
  const getISOWeek = (dateStr: string) => {
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    const week1 = new Date(date.getFullYear(), 0, 4);
    return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  };

  return {
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
    fetchAdminStats,
    fetchDashboard,
    fetchAllEnfunde,
    refreshAll,
    getISOWeek,
    showAlert,
    updateCosecha: async (id: number, cantidad: number) => {
      try {
        const res = await fetch(`${API_URL}/enfunde/${id}/cosecha`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ cantidad_cosechada: cantidad })
        });
        if (!res.ok) throw new Error('Error al actualizar cosecha');
        showAlert('Cosecha actualizada', 'success');
        return true;
      } catch (error: any) {
        showAlert(error.message, 'danger');
        return false;
      }
    },
    fetchHistorial: async (fincaId: number) => {
      try {
        const res = await fetch(`${API_URL}/fincas/${fincaId}/historial`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Error al obtener historial');
        return await res.json();
      } catch (error: any) {
        showAlert(error.message, 'danger');
        return [];
      }
    },
    deleteEnfunde: async (id: number) => {
      try {
        const res = await fetch(`${API_URL}/enfunde/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Error al eliminar registro');
        showAlert('Registro eliminado', 'success');
        
        // Actualizar estados locales inmediatamente
        if (user?.rol === 'admin') {
          setAllEnfunde(prev => prev.filter(r => r.id !== id));
          fetchDashboard();
          fetchAdminStats();
        }
        return true;
      } catch (error: any) {
        showAlert(error.message, 'danger');
        return false;
      }
    },
    deleteRegistro: async (id: number) => {
      try {
        const res = await fetch(`${API_URL}/enfunde/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Error al eliminar registro');
        showAlert('Registro eliminado', 'success');
        
        // Actualizar estados locales inmediatamente
        if (user?.rol === 'admin') {
          setAllEnfunde(prev => prev.filter(r => r.id !== id));
          fetchDashboard();
          fetchAdminStats();
        }
        return true;
      } catch (error: any) {
        showAlert(error.message, 'danger');
        return false;
      }
    },
    deleteFinca: async (id: number) => {
      try {
        const res = await fetch(`${API_URL}/fincas/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Error al eliminar finca');
        showAlert('Finca eliminada exitosamente', 'success');
        
        // Actualizar estados locales inmediatamente
        setFincas(prev => prev.filter(f => f.id !== id));
        if (user?.rol === 'admin') {
          fetchAdminStats();
          fetchDashboard();
          fetchAllEnfunde();
        }
        return true;
      } catch (error: any) {
        showAlert(error.message, 'danger');
        return false;
      }
    },
    API_URL
  };
};

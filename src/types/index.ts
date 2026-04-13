export interface User {
  id: number;
  username: string;
  rol: 'admin' | 'dueno';
}

export interface Finca {
  id: number;
  dueno_id: number;
  nombre: string;
  ubicacion: string;
  hectareas?: number;
  total_racimos?: number;
}

export interface RegistroEnfunde {
  id: number;
  finca_id: number;
  fecha_registro: string;
  cantidad_registrada: number;
  cantidad_cosechada: number;
  color_cinta: string;
  semana_enfunde?: number;
  semana_iso?: number;
  semana_cosecha_estimada: number;
  tipo_registro?: string;
}

export interface RegistroEnfundeDetalle extends RegistroEnfunde {
  finca_nombre: string;
  dueno_username: string;
}

export interface ColorConfig {
  id: number;
  finca_id: number;
  color_nombre: string;
  semanas_maduracion: number;
}

export interface AdminStats {
  totalDuenos: number;
  totalFincas: number;
}

export interface DuenoDetalle {
  id: number;
  username: string;
  fincas: number;
}

export interface FincaDetalle {
  finca: string;
  dueno: string;
  total_racimos: number;
  colores: string[];
  registros: {
    semana: number;
    color: string;
    cantidad: number;
  }[];
}

export interface ProyeccionFecha {
  semana: number;
  resultados: {
    finca: string;
    dueno: string;
    color_cinta: string;
    total: number;
  }[];
}

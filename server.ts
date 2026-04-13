import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;
const SECRET_KEY = 'banantrack_secret_key_2026';
const DB_FILE = './db.json';

app.use(cors());
app.use(express.json());

// --- DATABASE LOGIC (JSON FILE) ---
interface DB {
  usuarios: any[];
  fincas: any[];
  configuracion_colores: any[];
  registros_enfunde: any[];
}

const loadDB = (): DB => {
  if (!fs.existsSync(DB_FILE)) {
    const initialDB: DB = {
      usuarios: [],
      fincas: [],
      configuracion_colores: [],
      registros_enfunde: []
    };
    saveDB(initialDB);
    return initialDB;
  }
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
};

const saveDB = (db: DB) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
};

// Inicializar datos semilla
const initDB = async () => {
  const db = loadDB();
  if (db.usuarios.length === 0) {
    console.log('Inicializando datos semilla...');
    const adminHash = await bcrypt.hash('admin123', 10);
    const duenoHash = await bcrypt.hash('dueno123', 10);
    
    db.usuarios.push({ id: 1, username: 'admin', password: adminHash, rol: 'admin' });
    db.usuarios.push({ id: 2, username: 'dueno', password: duenoHash, rol: 'dueno' });
    
    db.fincas.push({ id: 1, dueno_id: 2, nombre: 'Finca Demo', hectareas: 50.5, ubicacion: 'Quevedo, Ecuador' });
    
    const colores = [
      ['Lila', 9], ['Blanco', 13], ['Verde', 11], ['Azul', 12],
      ['Roja', 14], ['Amarilla', 11], ['Café', 13], ['Negro', 10]
    ];
    
    colores.forEach((c, index) => {
      db.configuracion_colores.push({
        id: index + 1,
        finca_id: 1,
        color_nombre: c[0],
        semanas_maduracion: c[1]
      });
    });
    
    saveDB(db);
  }
};
initDB();

// --- MOTOR LÓGICO ---
const getISOWeek = (dateStr: string) => {
  const date = new Date(dateStr);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  const week1 = new Date(date.getFullYear(), 0, 4);
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
};

const calcular_semana_cosecha = (fecha_registro: string, color: string, finca_id: number) => {
  const db = loadDB();
  const semana_iso = getISOWeek(fecha_registro);
  const config = db.configuracion_colores.find(c => c.finca_id == finca_id && c.color_nombre === color);
  
  if (!config) throw new Error(`El color ${color} no existe en la configuración de la finca.`);
  
  let semana_cosecha = semana_iso + config.semanas_maduracion;
  if (semana_cosecha > 52) {
    semana_cosecha = semana_cosecha % 52;
    if (semana_cosecha === 0) semana_cosecha = 52;
  }
  return { semana_iso, semana_cosecha };
};

// --- MIDDLEWARE AUTENTICACIÓN ---
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token requerido' });

  jwt.verify(token, SECRET_KEY, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: 'Token inválido' });
    req.user = user;
    next();
  });
};

const requireRole = (role: string) => {
  return (req: any, res: any, next: any) => {
    if (req.user.rol !== role && req.user.rol !== 'admin') {
      return res.status(403).json({ error: 'Acceso denegado' });
    }
    next();
  };
};

// --- API REST ---

// Autenticación
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Datos incompletos' });

  const db = loadDB();
  if (db.usuarios.find(u => u.username === username)) {
    return res.status(400).json({ error: 'El usuario ya existe' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = {
    id: Date.now(),
    username,
    password: hashedPassword,
    rol: 'dueno' // Por defecto los nuevos son dueños
  };

  db.usuarios.push(newUser);
  saveDB(db);

  res.status(201).json({ message: 'Usuario registrado exitosamente' });
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Datos incompletos' });

  const db = loadDB();
  const user = db.usuarios.find(u => u.username === username);
  if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) return res.status(401).json({ error: 'Credenciales inválidas' });

  const token = jwt.sign({ id: user.id, username: user.username, rol: user.rol }, SECRET_KEY, { expiresIn: '24h' });
  res.json({ token, user: { id: user.id, username: user.username, rol: user.rol } });
});

// Fincas
app.get('/api/fincas', authenticateToken, (req: any, res) => {
  const db = loadDB();
  let fincas = db.fincas;
  
  if (req.user.rol === 'dueno') {
    fincas = fincas.filter(f => f.dueno_id == req.user.id);
  }
  
  // Agregar total de racimos (Pendientes)
  const result = fincas.map(f => {
    const total_racimos = db.registros_enfunde
      .filter(r => r.finca_id == f.id)
      .reduce((sum, r) => sum + ((r.cantidad_registrada || r.cantidad_racimos || 0) - (r.cantidad_cosechada || 0)), 0);
    return { ...f, total_racimos };
  });
  
  res.json(result);
});

app.post('/api/fincas', authenticateToken, requireRole('dueno'), (req: any, res) => {
  const { nombre, ubicacion, hectareas } = req.body;
  if (!nombre || !ubicacion) return res.status(400).json({ error: 'Datos incompletos' });

  const db = loadDB();
  const newFinca = {
    id: Date.now(),
    dueno_id: req.user.id,
    nombre,
    ubicacion,
    hectareas: parseFloat(hectareas) || 0
  };

  db.fincas.push(newFinca);

  // Inicializar colores por defecto para la nueva finca
  const coloresDefault = [
    ['Lila', 10], ['Blanco', 11], ['Verde', 12], ['Azul', 13],
    ['Roja', 9], ['Amarilla', 8], ['Café', 6], ['Negro', 14]
  ];

  coloresDefault.forEach((c, index) => {
    db.configuracion_colores.push({
      id: Date.now() + index,
      finca_id: newFinca.id,
      color_nombre: c[0],
      semanas_maduracion: c[1]
    });
  });

  saveDB(db);
  res.json(newFinca);
});

app.put('/api/fincas/:id', authenticateToken, requireRole('dueno'), (req: any, res) => {
  const id = parseInt(req.params.id);
  const { nombre, ubicacion, hectareas } = req.body;
  
  const db = loadDB();
  const index = db.fincas.findIndex(f => f.id === id && (f.dueno_id === req.user.id || req.user.rol === 'admin'));
  
  if (index === -1) return res.status(404).json({ error: 'Finca no encontrada' });

  db.fincas[index] = {
    ...db.fincas[index],
    nombre: nombre || db.fincas[index].nombre,
    ubicacion: ubicacion || db.fincas[index].ubicacion,
    hectareas: hectareas !== undefined ? parseFloat(hectareas) : db.fincas[index].hectareas
  };

  saveDB(db);
  res.json(db.fincas[index]);
});

app.delete('/api/fincas/:id', authenticateToken, requireRole('dueno'), (req: any, res) => {
  const id = parseInt(req.params.id);
  const db = loadDB();
  const index = db.fincas.findIndex(f => f.id === id && (f.dueno_id === req.user.id || req.user.rol === 'admin'));
  
  if (index === -1) return res.status(404).json({ error: 'Finca no encontrada' });

  // Borrado en cascada
  db.registros_enfunde = db.registros_enfunde.filter(r => r.finca_id !== id);
  db.configuracion_colores = db.configuracion_colores.filter(c => c.finca_id !== id);
  db.fincas.splice(index, 1);

  saveDB(db);
  res.json({ message: 'Finca y registros asociados eliminados exitosamente' });
});

app.get('/api/fincas/:id/last_enfunde', authenticateToken, (req: any, res) => {
  const id = parseInt(req.params.id);
  const db = loadDB();
  const registros = db.registros_enfunde
    .filter(r => r.finca_id === id)
    .sort((a, b) => b.id - a.id); // Más reciente primero

  if (registros.length === 0) return res.json(null);
  res.json(registros[0]);
});

// Configuración Colores
app.get('/api/configuracion_colores', authenticateToken, (req: any, res) => {
  const finca_id = req.query.finca_id;
  if (!finca_id) return res.status(400).json({ error: 'finca_id requerido' });

  const db = loadDB();
  const colores = db.configuracion_colores.filter(c => c.finca_id == finca_id);
  res.json(colores);
});

// Enfunde
app.post('/api/enfunde', authenticateToken, requireRole('dueno'), async (req, res) => {
  const { finca_id, fecha_registro, cantidad_racimos, color_cinta, tipo_registro } = req.body;
  if (!finca_id || !fecha_registro || !cantidad_racimos || !color_cinta) {
    return res.status(400).json({ error: 'Datos incompletos' });
  }

  try {
    const { semana_iso, semana_cosecha } = calcular_semana_cosecha(fecha_registro, color_cinta, parseInt(finca_id));
    
    const db = loadDB();
    const newRecord = {
      id: Date.now(),
      finca_id: parseInt(finca_id),
      fecha_registro,
      semana_iso,
      cantidad_registrada: parseInt(cantidad_racimos),
      cantidad_cosechada: 0,
      color_cinta,
      semana_cosecha_estimada: semana_cosecha,
      tipo_registro: tipo_registro || 'diario'
    };
    
    db.registros_enfunde.push(newRecord);
    saveDB(db);
    
    res.json({ id: newRecord.id, semana_cosecha_estimada: semana_cosecha });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/enfunde/:id/cosecha', authenticateToken, requireRole('dueno'), (req: any, res) => {
  const id = parseInt(req.params.id);
  const { cantidad_cosechada } = req.body;
  
  if (cantidad_cosechada === undefined) return res.status(400).json({ error: 'cantidad_cosechada requerida' });

  const db = loadDB();
  const index = db.registros_enfunde.findIndex(r => r.id === id);
  
  if (index === -1) return res.status(404).json({ error: 'Registro no encontrado' });

  db.registros_enfunde[index].cantidad_cosechada = parseInt(cantidad_cosechada);
  saveDB(db);
  
  res.json(db.registros_enfunde[index]);
});

app.get('/api/fincas/:id/historial', authenticateToken, (req: any, res) => {
  const id = parseInt(req.params.id);
  const db = loadDB();
  const registros = db.registros_enfunde
    .filter(r => r.finca_id === id)
    .sort((a, b) => b.id - a.id);
  
  res.json(registros);
});

app.delete('/api/enfunde/:id', authenticateToken, requireRole('dueno'), (req: any, res) => {
  const id = parseInt(req.params.id);
  const db = loadDB();
  const index = db.registros_enfunde.findIndex(r => r.id === id);
  
  if (index === -1) return res.status(404).json({ error: 'Registro no encontrado' });

  // Verificar que el registro pertenezca a una finca del usuario (a menos que sea admin)
  const finca = db.fincas.find(f => f.id === db.registros_enfunde[index].finca_id);
  if (req.user.rol !== 'admin' && (!finca || finca.dueno_id !== req.user.id)) {
    return res.status(403).json({ error: 'No tienes permiso para eliminar este registro' });
  }

  db.registros_enfunde.splice(index, 1);
  saveDB(db);
  
  res.json({ message: 'Registro eliminado exitosamente' });
});

// Dashboard
app.get('/api/admin/stats', authenticateToken, requireRole('admin'), (req: any, res) => {
  const db = loadDB();
  const totalDuenos = db.usuarios.filter(u => u.rol === 'dueno').length;
  const totalFincas = db.fincas.length;
  res.json({ totalDuenos, totalFincas });
});

app.get('/api/admin/duenos', authenticateToken, requireRole('admin'), (req: any, res) => {
  const db = loadDB();
  const duenos = db.usuarios.filter(u => u.rol === 'dueno');
  const result = duenos.map(u => {
    const fincasCount = db.fincas.filter(f => f.dueno_id == u.id).length;
    return { id: u.id, username: u.username, fincas: fincasCount };
  });
  res.json(result);
});

app.get('/api/admin/duenos/:id/fincas', authenticateToken, requireRole('admin'), (req: any, res) => {
  const duenoId = parseInt(req.params.id);
  const db = loadDB();
  
  const fincas = db.fincas.filter(f => f.dueno_id === duenoId);
  const result = fincas.map(f => {
    const registros = db.registros_enfunde.filter(r => r.finca_id === f.id);
    const total_registrado = registros.reduce((sum, r) => sum + (r.cantidad_registrada || 0), 0);
    const total_cosechado = registros.reduce((sum, r) => sum + (r.cantidad_cosechada || 0), 0);
    
    // Agrupar por semana de cosecha
    const porSemana: Record<number, number> = {};
    registros.forEach(r => {
      const w = r.semana_cosecha_estimada;
      porSemana[w] = (porSemana[w] || 0) + ((r.cantidad_registrada || 0) - (r.cantidad_cosechada || 0));
    });

    return {
      ...f,
      total_registrado,
      total_cosechado,
      pendiente: total_registrado - total_cosechado,
      proyecciones: Object.keys(porSemana).map(w => ({ semana: parseInt(w), cantidad: porSemana[parseInt(w)] })).sort((a, b) => a.semana - b.semana)
    };
  });
  
  res.json(result);
});

app.get('/api/admin/fincas_detalle', authenticateToken, requireRole('admin'), (req: any, res) => {
  const { semana, color } = req.query;
  const db = loadDB();
  
  const result = db.fincas.map(f => {
    const dueno = db.usuarios.find(u => u.id == f.dueno_id);
    const todosLosRegistros = db.registros_enfunde
      .filter(r => r.finca_id == f.id)
      .sort((a, b) => a.id - b.id); // Cronológico (antiguo a reciente)

    const total_racimos = todosLosRegistros.reduce((sum, r) => sum + ((r.cantidad_registrada || r.cantidad_racimos || 0) - (r.cantidad_cosechada || 0)), 0);
    
    // Últimos 8 colores
    const ultimos8 = todosLosRegistros.slice(-8);
    const colores = ultimos8.map(r => r.color_cinta);

    // Filtrar registros según parámetros
    let registrosFiltrados = db.registros_enfunde.filter(r => r.finca_id == f.id);
    
    if (semana) {
      registrosFiltrados = registrosFiltrados.filter(r => r.semana_cosecha_estimada == parseInt(semana as string));
    }
    if (color) {
      registrosFiltrados = registrosFiltrados.filter(r => r.color_cinta.toLowerCase() === (color as string).toLowerCase());
    }

    return {
      finca: f.nombre,
      dueno: dueno ? dueno.username : 'Desconocido',
      total_racimos,
      colores,
      registros: registrosFiltrados.map(r => ({
        semana: r.semana_cosecha_estimada,
        color: r.color_cinta,
        cantidad: (r.cantidad_registrada || r.cantidad_racimos || 0) - (r.cantidad_cosechada || 0),
        cantidad_cosechada: r.cantidad_cosechada || 0
      }))
    };
  });

  res.json(result);
});

app.get('/api/admin/proyeccion_fecha', authenticateToken, requireRole('admin'), (req: any, res) => {
  const { fecha } = req.query;
  if (!fecha) return res.status(400).json({ error: 'Fecha requerida' });

  const db = loadDB();
  const semana_calculada = getISOWeek(fecha as string);
  
  const fincasConCosecha: any[] = [];
  
  db.fincas.forEach(f => {
    const dueno = db.usuarios.find(u => u.id == f.dueno_id);
    const registrosSemana = db.registros_enfunde.filter(r => 
      r.finca_id == f.id && r.semana_cosecha_estimada == semana_calculada
    );

    if (registrosSemana.length > 0) {
      // Agrupar por color dentro de la finca
      const porColor: any = {};
      registrosSemana.forEach(r => {
        const pendiente = (r.cantidad_registrada || r.cantidad_racimos || 0) - (r.cantidad_cosechada || 0);
        porColor[r.color_cinta] = (porColor[r.color_cinta] || 0) + pendiente;
      });

      Object.keys(porColor).forEach(color => {
        fincasConCosecha.push({
          finca: f.nombre,
          dueno: dueno ? dueno.username : 'Desconocido',
          color_cinta: color,
          total: porColor[color]
        });
      });
    }
  });

  res.json({
    semana: semana_calculada,
    resultados: fincasConCosecha
  });
});

app.get('/api/admin/all_enfunde', authenticateToken, requireRole('admin'), (req: any, res) => {
  const db = loadDB();
  const result = db.registros_enfunde.map(r => {
    const finca = db.fincas.find(f => f.id == r.finca_id);
    const dueno = finca ? db.usuarios.find(u => u.id == finca.dueno_id) : null;
    return {
      ...r,
      finca_nombre: finca ? finca.nombre : 'Desconocida',
      dueno_username: dueno ? dueno.username : 'Desconocido'
    };
  });
  res.json(result);
});

app.get('/api/proyeccion', authenticateToken, (req: any, res) => {
  const { semanas } = req.query;
  if (!semanas) return res.status(400).json({ error: 'Número de semanas requerido' });

  const db = loadDB();
  const currentWeek = getISOWeek(new Date().toISOString());
  let targetWeek = currentWeek + parseInt(semanas as string);
  
  // Ajustar ciclo de 52 semanas
  while (targetWeek > 52) targetWeek -= 52;

  let registros = db.registros_enfunde.filter(r => r.semana_cosecha_estimada === targetWeek);

  // Si es dueño, solo sus registros
  if (req.user.rol === 'dueno') {
    const userFincas = db.fincas.filter(f => f.dueno_id == req.user.id).map(f => f.id);
    registros = registros.filter(r => userFincas.includes(r.finca_id));
  }

  const totalRacimos = registros.reduce((sum, r) => sum + ((r.cantidad_registrada || r.cantidad_racimos || 0) - (r.cantidad_cosechada || 0)), 0);

  res.json({ 
    semana_objetivo: targetWeek, 
    total_racimos: totalRacimos,
    mensaje: `En ${semanas} semanas (Semana ${targetWeek}) se proyectan: ${totalRacimos} racimos`
  });
});

app.get('/api/dashboard', authenticateToken, (req: any, res) => {
  const db = loadDB();
  let registros = db.registros_enfunde;

  if (req.user.rol === 'dueno') {
    const userFincas = db.fincas.filter(f => f.dueno_id == req.user.id).map(f => f.id);
    registros = registros.filter(r => userFincas.includes(r.finca_id));
  }

  const dashboard: any = {};
  registros.forEach(r => {
    const week = r.semana_cosecha_estimada;
    const registrado = r.cantidad_registrada || r.cantidad_racimos || 0;
    const cosechado = r.cantidad_cosechada || 0;
    const pendiente = registrado - cosechado;
    
    if (!dashboard[week]) {
      dashboard[week] = { registrado: 0, cosechado: 0, pendiente: 0 };
    }
    dashboard[week].registrado += registrado;
    dashboard[week].cosechado += cosechado;
    dashboard[week].pendiente += pendiente;
  });

  const result = Object.keys(dashboard).map(week => ({
    semana_cosecha_estimada: parseInt(week),
    total_registrado: dashboard[week].registrado,
    total_cosechado: dashboard[week].cosechado,
    total_racimos: dashboard[week].pendiente
  })).sort((a, b) => a.semana_cosecha_estimada - b.semana_cosecha_estimada);

  res.json(result);
});

// --- INTEGRACIÓN VITE ---
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production' || fs.existsSync(path.join(process.cwd(), 'dist'));
  
  if (!isProduction) {
    console.log('Starting in DEVELOPMENT mode (Vite middleware)');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log('Starting in PRODUCTION mode (Static files)');
    const distPath = path.join(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    } else {
      console.warn('Production mode enabled but dist/ not found. Falling back to Vite middleware.');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();


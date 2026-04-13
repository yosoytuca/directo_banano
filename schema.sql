CREATE TABLE IF NOT EXISTS Usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    rol TEXT NOT NULL CHECK(rol IN ('admin', 'dueno'))
);

CREATE TABLE IF NOT EXISTS Fincas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dueno_id INTEGER NOT NULL,
    nombre TEXT NOT NULL,
    hectareas REAL NOT NULL,
    ubicacion TEXT,
    FOREIGN KEY (dueno_id) REFERENCES Usuarios(id)
);

CREATE TABLE IF NOT EXISTS Configuracion_Colores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    finca_id INTEGER NOT NULL,
    color_nombre TEXT NOT NULL,
    semanas_maduracion INTEGER NOT NULL,
    FOREIGN KEY (finca_id) REFERENCES Fincas(id)
);

CREATE TABLE IF NOT EXISTS Registros_Enfunde (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    finca_id INTEGER NOT NULL,
    fecha_registro DATE NOT NULL,
    semana_iso INTEGER NOT NULL,
    cantidad_racimos INTEGER NOT NULL CHECK(cantidad_racimos > 0),
    color_cinta TEXT NOT NULL,
    semana_cosecha_estimada INTEGER NOT NULL,
    FOREIGN KEY (finca_id) REFERENCES Fincas(id)
);

CREATE INDEX IF NOT EXISTS idx_enfunde_finca ON Registros_Enfunde(finca_id);
CREATE INDEX IF NOT EXISTS idx_enfunde_cosecha ON Registros_Enfunde(semana_cosecha_estimada);

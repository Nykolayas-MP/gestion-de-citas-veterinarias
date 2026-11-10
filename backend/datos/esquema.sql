-- Se ejecuta cada vez que arranca el servidor.
-- Con IF NOT EXISTS no pasa nada si las tablas ya están creadas.

CREATE TABLE IF NOT EXISTS duenos (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre   TEXT NOT NULL,
  rut      TEXT NOT NULL UNIQUE,
  telefono TEXT NOT NULL,
  email    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS mascotas (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre  TEXT NOT NULL,
  especie TEXT NOT NULL CHECK (especie IN ('Perro', 'Gato', 'Conejo', 'Hámster', 'Ave', 'Otro')),
  raza    TEXT NOT NULL,
  edad    INTEGER NOT NULL CHECK (edad BETWEEN 0 AND 30),
  duenoId INTEGER NOT NULL REFERENCES duenos (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS citas (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  mascotaId     INTEGER NOT NULL REFERENCES mascotas (id) ON DELETE CASCADE,
  fecha         TEXT NOT NULL,
  hora          TEXT NOT NULL,
  motivo        TEXT NOT NULL,
  observaciones TEXT NOT NULL DEFAULT '',
  estado        TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'atendida', 'cancelada'))
);

-- Dos citas que no están canceladas no pueden tener la misma fecha y hora
CREATE UNIQUE INDEX IF NOT EXISTS citas_horario_unico ON citas (fecha, hora) WHERE estado <> 'cancelada';

-- La mascota y la fecha de la atención se sacan de su cita
CREATE TABLE IF NOT EXISTS atenciones (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  citaId       INTEGER NOT NULL UNIQUE REFERENCES citas (id) ON DELETE CASCADE,
  diagnostico  TEXT NOT NULL,
  tratamiento  TEXT NOT NULL,
  medicamentos TEXT NOT NULL DEFAULT ''
);

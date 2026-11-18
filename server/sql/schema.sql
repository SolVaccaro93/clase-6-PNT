-- Ejecutar completo en SQL Server Management Studio (conectado a localhost).
-- Crea la base BibliotecaDB y todas las tablas. Los usuarios (lector / admin)
-- los inserta el servidor al arrancar, porque necesitan la clave hasheada.
IF DB_ID('BibliotecaDB') IS NULL CREATE DATABASE BibliotecaDB;
GO
USE BibliotecaDB;
GO

IF OBJECT_ID('dbo.Usuarios') IS NULL
CREATE TABLE dbo.Usuarios (
  id         INT IDENTITY PRIMARY KEY,
  usuario    NVARCHAR(50)  NOT NULL UNIQUE,
  nombre     NVARCHAR(100) NOT NULL,
  rol        NVARCHAR(20)  NOT NULL CHECK (rol IN ('visita','admin','dueno')),
  clave_hash NVARCHAR(100) NOT NULL
);

IF OBJECT_ID('dbo.Sesiones') IS NULL
CREATE TABLE dbo.Sesiones (
  token      CHAR(64) PRIMARY KEY,
  id_usuario INT NOT NULL REFERENCES dbo.Usuarios(id),
  creada     DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  expira     DATETIME2 NOT NULL
);

IF OBJECT_ID('dbo.PreferenciasLectura') IS NULL
CREATE TABLE dbo.PreferenciasLectura (
  id_usuario INT PRIMARY KEY REFERENCES dbo.Usuarios(id),
  genero     NVARCHAR(50)  NULL,
  idioma     NVARCHAR(20)  NULL,
  anio_desde INT NULL,
  anio_hasta INT NULL
);

IF OBJECT_ID('dbo.LibrosVistos') IS NULL
CREATE TABLE dbo.LibrosVistos (
  id          INT IDENTITY PRIMARY KEY,
  id_usuario  INT NOT NULL REFERENCES dbo.Usuarios(id),
  clave_libro NVARCHAR(100) NOT NULL,
  titulo      NVARCHAR(300) NULL,
  fecha       DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

IF OBJECT_ID('dbo.Votos') IS NULL
CREATE TABLE dbo.Votos (
  id_usuario  INT NOT NULL REFERENCES dbo.Usuarios(id),
  clave_libro NVARCHAR(100) NOT NULL,
  puntaje     DECIMAL(2,1) NOT NULL CHECK (puntaje BETWEEN 0.5 AND 5),
  PRIMARY KEY (id_usuario, clave_libro)
);

IF OBJECT_ID('dbo.Prestamos') IS NULL
CREATE TABLE dbo.Prestamos (
  id_prestamo      NVARCHAR(50) PRIMARY KEY,
  id_usuario       INT NOT NULL REFERENCES dbo.Usuarios(id),
  clave_libro      NVARCHAR(100) NOT NULL,
  titulo           NVARCHAR(300) NULL,
  autor            NVARCHAR(300) NULL,
  id_sucursal      NVARCHAR(50)  NOT NULL,
  sucursal         NVARCHAR(100) NULL,
  fecha_retiro     NVARCHAR(40)  NOT NULL,
  fecha_devolucion NVARCHAR(40)  NULL,
  estado_lectura   NVARCHAR(20)  NOT NULL DEFAULT 'leyendo'
);

IF OBJECT_ID('dbo.Stock') IS NULL
CREATE TABLE dbo.Stock (
  clave_libro NVARCHAR(100) NOT NULL,
  id_sucursal NVARCHAR(50)  NOT NULL,
  cantidad    INT NOT NULL,
  PRIMARY KEY (clave_libro, id_sucursal)
);
GO

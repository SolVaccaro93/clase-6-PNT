import "dotenv/config";
import sql from "mssql";
import bcrypt from "bcryptjs";

const config = {
  server: process.env.DB_SERVER || "localhost",
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
  database: process.env.DB_NAME || "BibliotecaDB",
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    instanceName: process.env.DB_INSTANCE || undefined
  }
};

let poolPromise;
export function getPool() {
  poolPromise ??= sql.connect(config);
  return poolPromise;
}

export { sql };

const SQL_EVENTOS = `IF OBJECT_ID('dbo.Eventos') IS NULL
  CREATE TABLE dbo.Eventos (
    id INT IDENTITY PRIMARY KEY,
    tipo NVARCHAR(30) NOT NULL,
    texto NVARCHAR(200) NOT NULL,
    resultados INT NOT NULL,
    id_usuario INT NULL REFERENCES dbo.Usuarios(id),
    fecha DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  )`;

// Inserta los usuarios de prueba si no existen (clave hasheada con bcrypt).
export async function asegurarUsuarios() {
  const pool = await getPool();
  const usuarios = [
    { usuario: "lector", clave: "123", nombre: "Sol Vaccaro", rol: "visita" },
    { usuario: "admin", clave: "admin", nombre: "Matías Gratz", rol: "admin" },
    { usuario: "duenolibreria", clave: "dueno", nombre: "Dueño de la librería", rol: "dueno" }
  ];
  // Tabla de búsquedas para las métricas del dueño (bases creadas antes de existir).
  await pool.request().query(SQL_EVENTOS);
  // Bases creadas antes del rol "dueno": se reemplaza el CHECK de Usuarios.rol por uno que lo admita.
  await pool.request().query(`
    DECLARE @ck NVARCHAR(200) = (SELECT TOP 1 name FROM sys.check_constraints
      WHERE parent_object_id = OBJECT_ID('dbo.Usuarios') AND definition NOT LIKE '%dueno%');
    IF @ck IS NOT NULL BEGIN
      EXEC('ALTER TABLE dbo.Usuarios DROP CONSTRAINT ' + @ck);
      ALTER TABLE dbo.Usuarios ADD CONSTRAINT CK_Usuarios_rol CHECK (rol IN ('visita','admin','dueno'));
    END`);
  for (const u of usuarios) {
    const hash = await bcrypt.hash(u.clave, 10);
    await pool.request()
      .input("usuario", sql.NVarChar, u.usuario)
      .input("nombre", sql.NVarChar, u.nombre)
      .input("rol", sql.NVarChar, u.rol)
      .input("hash", sql.NVarChar, hash)
      .query(`IF NOT EXISTS (SELECT 1 FROM dbo.Usuarios WHERE usuario = @usuario)
              INSERT INTO dbo.Usuarios (usuario, nombre, rol, clave_hash)
              VALUES (@usuario, @nombre, @rol, @hash)`);
  }
}

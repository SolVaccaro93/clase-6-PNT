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

// Inserta los usuarios de prueba si no existen (clave hasheada con bcrypt).
export async function asegurarUsuarios() {
  const pool = await getPool();
  const usuarios = [
    { usuario: "lector", clave: "123", nombre: "Sol Vaccaro", rol: "visita" },
    { usuario: "admin", clave: "admin", nombre: "Matías Gratz", rol: "admin" }
  ];
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

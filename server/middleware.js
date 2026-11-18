import { getPool, sql } from "./db.js";

// Busca el token en la tabla Sesiones; si es válido y no venció, deja el
// usuario en req.usuario. Si no, responde 401.
export async function requireAuth(req, res, next) {
  try {
    const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
    if (!token) return res.status(401).json({ error: "Sesión requerida." });
    const pool = await getPool();
    const { recordset } = await pool.request()
      .input("token", sql.Char, token)
      .query(`SELECT u.id, u.usuario, u.nombre, u.rol
              FROM dbo.Sesiones s JOIN dbo.Usuarios u ON u.id = s.id_usuario
              WHERE s.token = @token AND s.expira > SYSUTCDATETIME()`);
    if (!recordset.length) return res.status(401).json({ error: "Sesión inválida o vencida." });
    req.usuario = recordset[0];
    req.token = token;
    next();
  } catch (e) { next(e); }
}

export function requireAdmin(req, res, next) {
  if (!["admin", "dueno"].includes(req.usuario?.rol)) return res.status(403).json({ error: "Solo administradores." });
  next();
}

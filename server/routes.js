import crypto from "node:crypto";
import { Router } from "express";
import bcrypt from "bcryptjs";
import { getPool, sql } from "./db.js";
import { requireAuth, requireAdmin, authOpcional } from "./middleware.js";

const router = Router();
const wrap = (fn) => (req, res, next) => fn(req, res).catch(next);
const HORAS_SESION = 24 * 7;

// ---------- AUTH + SESIONES ----------
router.post("/auth/login", wrap(async (req, res) => {
  const { usuario = "", clave = "" } = req.body || {};
  const pool = await getPool();
  const { recordset } = await pool.request()
    .input("usuario", sql.NVarChar, String(usuario).trim())
    .query("SELECT id, usuario, nombre, rol, clave_hash FROM dbo.Usuarios WHERE usuario = @usuario");
  const u = recordset[0];
  if (!u || !(await bcrypt.compare(String(clave), u.clave_hash))) {
    return res.status(401).json({ error: "Usuario o contraseña incorrectos." });
  }
  const token = crypto.randomBytes(32).toString("hex");
  await pool.request()
    .input("token", sql.Char, token)
    .input("id", sql.Int, u.id)
    .input("horas", sql.Int, HORAS_SESION)
    .query(`INSERT INTO dbo.Sesiones (token, id_usuario, expira)
            VALUES (@token, @id, DATEADD(HOUR, @horas, SYSUTCDATETIME()))`);
  res.json({ token, usuario: { usuario: u.usuario, nombre: u.nombre, rol: u.rol } });
}));

router.get("/auth/me", requireAuth, (req, res) => {
  const { usuario, nombre, rol } = req.usuario;
  res.json({ usuario: { usuario, nombre, rol } });
});

router.post("/auth/logout", requireAuth, wrap(async (req, res) => {
  const pool = await getPool();
  await pool.request().input("token", sql.Char, req.token)
    .query("DELETE FROM dbo.Sesiones WHERE token = @token");
  res.json({ ok: true });
}));

// ---------- PREFERENCIAS (cuestionario de gustos) ----------
router.get("/preferencias", requireAuth, wrap(async (req, res) => {
  const pool = await getPool();
  const { recordset } = await pool.request().input("id", sql.Int, req.usuario.id)
    .query("SELECT genero, idioma, anio_desde, anio_hasta FROM dbo.PreferenciasLectura WHERE id_usuario = @id");
  const p = recordset[0];
  res.json(p ? { genero: p.genero, idioma: p.idioma, anioDesde: p.anio_desde, anioHasta: p.anio_hasta } : null);
}));

router.put("/preferencias", requireAuth, wrap(async (req, res) => {
  const { genero = null, idioma = null, anioDesde = null, anioHasta = null } = req.body || {};
  const pool = await getPool();
  await pool.request()
    .input("id", sql.Int, req.usuario.id)
    .input("genero", sql.NVarChar, genero)
    .input("idioma", sql.NVarChar, idioma)
    .input("desde", sql.Int, Number.isInteger(anioDesde) ? anioDesde : null)
    .input("hasta", sql.Int, Number.isInteger(anioHasta) ? anioHasta : null)
    .query(`MERGE dbo.PreferenciasLectura AS t USING (SELECT @id AS id) s ON t.id_usuario = s.id
            WHEN MATCHED THEN UPDATE SET genero=@genero, idioma=@idioma, anio_desde=@desde, anio_hasta=@hasta
            WHEN NOT MATCHED THEN INSERT (id_usuario, genero, idioma, anio_desde, anio_hasta)
              VALUES (@id, @genero, @idioma, @desde, @hasta);`);
  res.json({ ok: true });
}));

// ---------- LIBROS VISTOS ----------
router.post("/vistos", requireAuth, wrap(async (req, res) => {
  const { claveLibro, titulo = null } = req.body || {};
  if (!claveLibro) return res.status(400).json({ error: "Falta claveLibro." });
  const pool = await getPool();
  await pool.request()
    .input("id", sql.Int, req.usuario.id)
    .input("clave", sql.NVarChar, claveLibro)
    .input("titulo", sql.NVarChar, titulo)
    .query("INSERT INTO dbo.LibrosVistos (id_usuario, clave_libro, titulo) VALUES (@id, @clave, @titulo)");
  res.json({ ok: true });
}));

router.get("/vistos", requireAuth, wrap(async (req, res) => {
  const pool = await getPool();
  const { recordset } = await pool.request().input("id", sql.Int, req.usuario.id)
    .query(`SELECT TOP 50 clave_libro AS claveLibro, titulo, MAX(fecha) AS fecha, COUNT(*) AS veces
            FROM dbo.LibrosVistos WHERE id_usuario = @id
            GROUP BY clave_libro, titulo ORDER BY MAX(fecha) DESC`);
  res.json(recordset);
}));

// ---------- VOTOS ----------
// Devuelve { [claveLibro]: { [usuario]: puntaje } }, la misma forma que usa votosStore.
router.get("/votos", requireAuth, wrap(async (_req, res) => {
  const pool = await getPool();
  const { recordset } = await pool.request()
    .query(`SELECT v.clave_libro, u.usuario, v.puntaje
            FROM dbo.Votos v JOIN dbo.Usuarios u ON u.id = v.id_usuario`);
  const votos = {};
  for (const r of recordset) (votos[r.clave_libro] ??= {})[r.usuario] = Number(r.puntaje);
  res.json(votos);
}));

router.put("/votos", requireAuth, wrap(async (req, res) => {
  const { claveLibro, puntaje } = req.body || {};
  const n = Number(puntaje);
  if (!claveLibro || !(n >= 0.5 && n <= 5) || (n * 2) % 1 !== 0) {
    return res.status(400).json({ error: "Voto inválido." });
  }
  const pool = await getPool();
  await pool.request()
    .input("id", sql.Int, req.usuario.id)
    .input("clave", sql.NVarChar, claveLibro)
    .input("p", sql.Decimal(2, 1), n)
    .query(`MERGE dbo.Votos AS t USING (SELECT @id AS id, @clave AS clave) s
              ON t.id_usuario = s.id AND t.clave_libro = s.clave
            WHEN MATCHED THEN UPDATE SET puntaje = @p
            WHEN NOT MATCHED THEN INSERT (id_usuario, clave_libro, puntaje) VALUES (@id, @clave, @p);`);
  res.json({ ok: true });
}));

router.delete("/votos", requireAuth, requireAdmin, wrap(async (_req, res) => {
  const pool = await getPool();
  await pool.request().query("DELETE FROM dbo.Votos");
  res.json({ ok: true });
}));

// ---------- PRÉSTAMOS + STOCK ----------
router.get("/datos", requireAuth, wrap(async (req, res) => {
  const pool = await getPool();
  const pr = await pool.request().input("id", sql.Int, req.usuario.id)
    .query(`SELECT id_prestamo, clave_libro, titulo, autor, id_sucursal, sucursal,
                   fecha_retiro, fecha_devolucion, estado_lectura
            FROM dbo.Prestamos WHERE id_usuario = @id ORDER BY fecha_retiro`);
  const st = await pool.request().query("SELECT clave_libro, id_sucursal, cantidad FROM dbo.Stock");
  const stock = {};
  for (const r of st.recordset) (stock[r.clave_libro] ??= {})[r.id_sucursal] = r.cantidad;
  const prestamos = pr.recordset.map((p) => ({
    ...p, id_usuario: req.usuario.usuario, id_sucursal: Number(p.id_sucursal)
  }));
  res.json({ prestamos, stock });
}));

async function upsertStock(tx, { clave, sucursal, cantidad }) {
  await new sql.Request(tx)
    .input("clave", sql.NVarChar, clave)
    .input("suc", sql.NVarChar, String(sucursal))
    .input("cant", sql.Int, cantidad)
    .query(`MERGE dbo.Stock AS t USING (SELECT @clave AS clave, @suc AS suc) s
              ON t.clave_libro = s.clave AND t.id_sucursal = s.suc
            WHEN MATCHED THEN UPDATE SET cantidad = @cant
            WHEN NOT MATCHED THEN INSERT (clave_libro, id_sucursal, cantidad) VALUES (@clave, @suc, @cant);`);
}

function stockValido(s) {
  return s && s.clave && s.sucursal != null && Number.isInteger(s.cantidad) && s.cantidad >= 0;
}

// Guarda un préstamo (retiro o devolución) y la celda de stock afectada, en una transacción.
router.put("/prestamos", requireAuth, wrap(async (req, res) => {
  const { prestamo: p, stock } = req.body || {};
  if (!p?.id_prestamo || !p.clave_libro || !stockValido(stock)) {
    return res.status(400).json({ error: "Datos de préstamo inválidos." });
  }
  const pool = await getPool();
  const tx = new sql.Transaction(pool);
  await tx.begin();
  try {
    await new sql.Request(tx)
      .input("idp", sql.NVarChar, p.id_prestamo)
      .input("idu", sql.Int, req.usuario.id)
      .input("clave", sql.NVarChar, p.clave_libro)
      .input("titulo", sql.NVarChar, p.titulo ?? null)
      .input("autor", sql.NVarChar, p.autor ?? null)
      .input("suc", sql.NVarChar, String(p.id_sucursal))
      .input("sucn", sql.NVarChar, p.sucursal ?? null)
      .input("ret", sql.NVarChar, p.fecha_retiro)
      .input("dev", sql.NVarChar, p.fecha_devolucion ?? null)
      .input("est", sql.NVarChar, p.estado_lectura || "leyendo")
      .query(`MERGE dbo.Prestamos AS t USING (SELECT @idp AS id) s ON t.id_prestamo = s.id AND t.id_usuario = @idu
              WHEN MATCHED THEN UPDATE SET fecha_devolucion=@dev, estado_lectura=@est
              WHEN NOT MATCHED THEN INSERT (id_prestamo,id_usuario,clave_libro,titulo,autor,id_sucursal,sucursal,fecha_retiro,fecha_devolucion,estado_lectura)
                VALUES (@idp,@idu,@clave,@titulo,@autor,@suc,@sucn,@ret,@dev,@est);`);
    await upsertStock(tx, stock);
    await tx.commit();
    res.json({ ok: true });
  } catch (e) { await tx.rollback(); throw e; }
}));

// Ajuste manual de stock (panel admin).
router.put("/stock", requireAuth, requireAdmin, wrap(async (req, res) => {
  if (!stockValido(req.body)) return res.status(400).json({ error: "Stock inválido." });
  const pool = await getPool();
  const tx = new sql.Transaction(pool);
  await tx.begin();
  try { await upsertStock(tx, req.body); await tx.commit(); res.json({ ok: true }); }
  catch (e) { await tx.rollback(); throw e; }
}));

// ---------- MÉTRICAS DEL DUEÑO (lectura de la actividad de todos los usuarios) ----------
router.get("/admin/prestamos", requireAuth, requireAdmin, wrap(async (_req, res) => {
  const pool = await getPool();
  const { recordset } = await pool.request()
    .query(`SELECT p.id_prestamo, u.usuario AS id_usuario, p.clave_libro, p.titulo, p.autor,
                   p.id_sucursal, p.sucursal, p.fecha_retiro, p.fecha_devolucion, p.estado_lectura
            FROM dbo.Prestamos p JOIN dbo.Usuarios u ON u.id = p.id_usuario`);
  res.json(recordset.map((p) => ({ ...p, id_sucursal: Number(p.id_sucursal) })));
}));

// Registra una búsqueda (también sin sesión; si hay, se guarda quién la hizo).
router.post("/eventos", authOpcional, wrap(async (req, res) => {
  const { texto, resultados } = req.body || {};
  const limpio = String(texto || "").trim().toLowerCase().slice(0, 200);
  if (limpio.length < 3 || !Number.isInteger(resultados) || resultados < 0) {
    return res.status(400).json({ error: "Evento inválido." });
  }
  const pool = await getPool();
  await pool.request()
    .input("texto", sql.NVarChar, limpio)
    .input("res", sql.Int, resultados)
    .input("idu", sql.Int, req.usuario?.id ?? null)
    .query("INSERT INTO dbo.Eventos (tipo, texto, resultados, id_usuario) VALUES ('busqueda', @texto, @res, @idu)");
  res.json({ ok: true });
}));

router.get("/eventos", requireAuth, requireAdmin, wrap(async (_req, res) => {
  const pool = await getPool();
  const { recordset } = await pool.request()
    .query(`SELECT TOP 1000 e.tipo, e.texto, e.resultados, u.usuario, e.fecha
            FROM dbo.Eventos e LEFT JOIN dbo.Usuarios u ON u.id = e.id_usuario
            ORDER BY e.fecha DESC`);
  res.json(recordset.map((e) => ({ ...e, fecha: new Date(e.fecha).toISOString() })));
}));

export default router;

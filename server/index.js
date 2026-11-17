import express from "express";
import { asegurarUsuarios } from "./db.js";
import routes from "./routes.js";

const app = express();
app.use(express.json());
app.use("/api", routes);

// Manejo de errores: no se filtra el detalle de la base al cliente.
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Error interno del servidor." });
});

const PUERTO = process.env.PORT || 3001;
try {
  await asegurarUsuarios();
  app.listen(PUERTO, () => console.log(`API lista en http://localhost:${PUERTO}`));
} catch (e) {
  console.error("No se pudo conectar a SQL Server. Revisá server/.env y que BibliotecaDB exista.\n", e.message);
  process.exit(1);
}

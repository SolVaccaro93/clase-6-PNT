# Documentación Técnica: Persistencia con SQL Server

## 📌 Requerimiento
Persistir en una base de datos las sesiones de los usuarios y los datos que hasta ahora vivían en `localStorage`. La base es **SQL Server en localhost**, la misma que se abre con SQL Server Management Studio (SSMS).

## ⚙️ Arquitectura
Un navegador no puede conectarse a SQL Server, así que se agregó un backend Node + Express en `server/`.

```
Vue (stores y servicios) --fetch /api--> Express (server/) --mssql--> SQL Server (BibliotecaDB)
```

* En desarrollo, Vite redirige `/api` al puerto 3001 (`vite.config.js`).
* El front guarda en el navegador solo el **token** de sesión (`biblioteca_token`). Todo lo demás se lee de la base al iniciar sesión.
* Los datos se siguen escribiendo también en `localStorage`, como copia local. Los tests y la app sin sesión funcionan sin servidor.

## 🗄️ Tablas (`server/sql/schema.sql`)
| Tabla | Qué guarda |
|---|---|
| `Usuarios` | usuario, nombre, rol y clave hasheada con bcrypt |
| `Sesiones` | token (64 caracteres), usuario, fecha de creación y de vencimiento (7 días) |
| `PreferenciasLectura` | gustos del quiz: género, idioma y rango de años. Una fila por usuario |
| `LibrosVistos` | cada vez que un usuario abre el detalle de un libro |
| `Votos` | estrellas: un voto por usuario y libro, con el título del libro para las métricas |
| `Prestamos` | retiros y devoluciones |
| `Stock` | cantidad por libro y sucursal (solo las celdas que cambiaron) |
| `Eventos` | búsquedas de los usuarios (texto, resultados y quién), para las métricas del dueño |

Los libros no se guardan: vienen de OpenLibrary. Las tablas los identifican con `clave_libro` (por ejemplo `/works/OL123W`), que es estable.

## 🔌 Endpoints (`server/routes.js`)
| Ruta | Quién | Para qué |
|---|---|---|
| `POST /api/auth/login` | todos | valida la clave y crea la sesión |
| `GET /api/auth/me` | con sesión | confirma que el token sigue vigente |
| `POST /api/auth/logout` | con sesión | borra la fila de `Sesiones` |
| `GET` / `PUT /api/preferencias` | con sesión | gustos del quiz |
| `GET` / `POST /api/vistos` | con sesión | historial de libros vistos |
| `GET` / `PUT /api/votos` | con sesión | leer todos los votos, votar |
| `DELETE /api/votos` | admin o dueño | reiniciar votos |
| `GET /api/datos` | con sesión | préstamos del usuario y stock |
| `PUT /api/prestamos` | con sesión | guardar un retiro o devolución y su stock (en una transacción) |
| `PUT /api/stock` | admin o dueño | ajuste manual de stock |
| `GET /api/admin/prestamos` | admin o dueño | préstamos de **todos** los usuarios (métricas) |
| `POST /api/eventos` | todos (con o sin sesión) | registra una búsqueda |
| `GET /api/eventos` | admin o dueño | búsquedas de todos los usuarios (métricas) |

`requireAuth` (`server/middleware.js`) busca el token en `Sesiones` y responde **401** si falta o venció. `requireAdmin` responde **403** si el rol no es `admin` ni `dueno`.

## 🔐 Cómo funciona la sesión
1. `authStore.login` llama a `/api/auth/login`. El servidor compara la clave con el hash y crea una fila en `Sesiones`.
2. El front guarda el token y carga desde la base los votos, préstamos, stock y gustos (`hidratarDatos`, en `src/services/apiClient.js`).
3. Al recargar la página, el guardia del router espera a `restaurarSesion`, que llama a `/api/auth/me`. Si da 401, se limpia la sesión local. Si el servidor no responde, se conserva la copia local.
4. `logout` limpia el navegador al instante y borra la fila de `Sesiones`.

## 🚀 Cómo inicializar la base
> La guía completa, con los errores que aparecen en una PC nueva, está en `DOCUMENTACION_SETUP_BACKEND.md`. Lo que sigue es un resumen.

1. **SQL Server en marcha.** Debe estar iniciado el servicio (en la edición Express se llama `SQL Server (SQLEXPRESS)`). Hace falta autenticación SQL habilitada ("SQL Server and Windows Authentication mode") y un usuario con permisos, por ejemplo `sa` con clave.
2. **Crear la base y las tablas.** En SSMS, conectarse a `localhost`, abrir `server/sql/schema.sql` y ejecutarlo completo (F5). Es repetible: no pisa lo que ya existe.
3. **Configurar la conexión.** Copiar `.env.example` a `.env` en la **raíz del proyecto** y completar:
   ```
   DB_SERVER=localhost
   DB_PORT=1433
   DB_NAME=BibliotecaDB
   DB_USER=biblioteca
   DB_PASSWORD=su_clave
   PORT=3001
   ```
   `DB_PORT` es el puerto de SQL Server y `PORT` el del backend. Con una instancia por nombre se usa `DB_INSTANCE` en lugar de `DB_PORT`, nunca los dos.
4. **Levantar el backend:** `npm run server`. Debe imprimir `API lista en http://localhost:3001`. Al arrancar crea los usuarios `lector` / `123`, `admin` / `admin` y `duenolibreria` / `dueno` si no existen. Si la tabla `Usuarios` se creó antes del rol `dueno`, también actualiza su restricción para admitirlo.
5. **Levantar el front** en otra terminal: `npm run dev`.

## 🔍 Cómo ver la persistencia en SSMS
Después de cada acción, ejecutar la consulta que corresponda (clic derecho en `BibliotecaDB` → *New Query*):

| Acción en la app | Consulta |
|---|---|
| Iniciar sesión | `SELECT * FROM dbo.Sesiones;` |
| Cerrar sesión | la misma consulta: la fila desaparece |
| Completar el quiz de gustos | `SELECT * FROM dbo.PreferenciasLectura;` |
| Abrir el detalle de un libro | `SELECT * FROM dbo.LibrosVistos ORDER BY fecha DESC;` |
| Calificar con estrellas | `SELECT * FROM dbo.Votos;` |
| Retirar o devolver un libro | `SELECT * FROM dbo.Prestamos;` y `SELECT * FROM dbo.Stock;` |

Consulta útil para cruzar gustos con lo visto:
```sql
SELECT u.usuario, p.genero, p.idioma, v.titulo, COUNT(*) AS veces
FROM dbo.Usuarios u
LEFT JOIN dbo.PreferenciasLectura p ON p.id_usuario = u.id
LEFT JOIN dbo.LibrosVistos v ON v.id_usuario = u.id
GROUP BY u.usuario, p.genero, p.idioma, v.titulo;
```

**Prueba de punta a punta:**
1. Entrar como `lector` / `123` y mirar `Sesiones`: aparece una fila.
2. Completar el quiz, abrir dos libros, votar uno y retirar otro. Revisar cada tabla.
3. Recargar la página: sigue la sesión y se ven los mismos votos y préstamos.
4. Abrir la app en otro navegador y entrar con el mismo usuario: aparecen los mismos datos.
5. Cerrar sesión: la fila de `Sesiones` desaparece.

## ⚠️ Problemas frecuentes
| Síntoma | Causa probable |
|---|---|
| `No se pudo conectar a SQL Server` al correr `npm run server` | servicio detenido, TCP/IP deshabilitado (SQL Server Configuration Manager → Protocols → TCP/IP), o `DB_INSTANCE` mal puesto |
| `Login failed for user` | autenticación SQL no habilitada, o clave incorrecta en `.env` |
| La app dice "No se pudo conectar con el servidor" | el backend no está corriendo o Vite se levantó sin proxy (reiniciar `npm run dev`) |
| Las tablas están vacías aunque la app anda | no hay sesión iniciada: sin token, los datos solo se guardan en `localStorage` |
| `Cannot open database "BibliotecaDB"` | falta ejecutar `schema.sql` |

## ✅ Tests
Los tests existentes simulan la sesión (`iniciar(auth, "lector")`) en vez de hacer login real, porque no hay servidor en `npm test`. Las rutas del backend **no tienen tests automáticos**: se comprueban a mano con los pasos de arriba.

## ⚠️ Limitaciones
* La clave y el token viajan por HTTP sin cifrar: sirve para desarrollo local, no para producción.
* Si falla un guardado en el servidor, la pantalla ya cambió: solo se avisa por consola y queda la copia en `localStorage`.
* No hay registro de usuarios nuevos: solo `lector`, `admin` y `duenolibreria`.
* `AmigosService` y los eventos de métricas siguen con datos simulados o en `localStorage`.

## 📊 Métricas del dueño
Las métricas muestran la actividad de **todos** los usuarios, no solo la del navegador del dueño:
* **Préstamos:** `GET /api/admin/prestamos` (el `GET /api/datos` devuelve solo los del usuario actual).
* **Búsquedas:** se guardan en la tabla `Eventos` desde el navegador de quien busca (con sesión) y el dueño las lee con `GET /api/eventos`.
* **Votos y stock:** se vuelven a leer de la base cada vez que se abre la pantalla de métricas.

Para ver el efecto: entrar como `lector`, buscar un libro, votar y retirar uno. Después entrar como `duenolibreria` y abrir **Métricas**. Las búsquedas anteriores a este cambio no están en la base, así que no aparecen.

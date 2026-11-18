# Arquitectura del proyecto y APIs, de punta a punta

Este documento explica cómo está armado el proyecto: las tecnologías, cómo viaja un dato desde que se pide hasta que se guarda, y las dos APIs que intervienen. Las funcionalidades puntuales tienen su propio documento en `docs/`.

## 1. Qué es el proyecto
Un catálogo de biblioteca. Permite explorar libros, ver disponibilidad por sucursal, retirar y devolver ejemplares, calificar con estrellas y ver la actividad de los amigos. Hay tres roles: **visita** (`lector`), **admin** y **dueño** (ve además las métricas).

## 2. Tecnologías y para qué se usa cada una
| Tecnología | Dónde | Para qué |
|---|---|---|
| **Vue 3** | `src/` | Interfaz. Componentes `.vue` con `<script setup>`, reactividad con `ref` y `computed`. |
| **Vite** | `vite.config.js` | Servidor de desarrollo y compilación. Redirige `/api` al backend. |
| **Vue Router 4** | `src/router/index.js` | Navegación con hash (`/#/libros`). Guardias para rutas con sesión, de admin y de dueño. |
| **Pinia** | `src/stores/` | Estado compartido: sesión (`authStore`) y votos (`votosStore`). |
| **Leaflet** | `MapaSucursales.vue` | Mapa de sucursales. Los mosaicos vienen de OpenStreetMap. |
| **date-fns** | servicios | Fechas: vencimiento de préstamos, períodos de las métricas. |
| **Node.js + Express** | `server/` | Backend: API propia con la lógica de sesión y persistencia. |
| **SQL Server + `mssql`** | `server/db.js` | Base de datos. Consultas parametrizadas desde Node. |
| **bcryptjs** | `server/` | Hash de contraseñas. |
| **dotenv** | `server/db.js` | Lee la configuración de la base desde `.env`. |
| **`node --test`** | `tests/` | Tests con el ejecutor nativo de Node, sin librerías extra. |

Nota: `bulma` figura en `package.json` pero no se importa en ningún archivo. Los estilos están en `src/style.css` y en cada componente.

## 3. Vista general
```
                    ┌──────────────── navegador ────────────────┐
                    │  Vue + Pinia + Router                      │
                    │   vistas ─► servicios / stores             │
                    └───────┬───────────────────────┬───────────┘
                            │ /api (token)          │ HTTPS
                            ▼                       ▼
                  ┌──────────────────┐     ┌────────────────────────┐
                  │ Express (server/)│     │ APIs externas          │
                  │  puerto 3001     │     │ OpenLibrary (libros)   │
                  └────────┬─────────┘     │ OpenLibrary Covers     │
                           │ mssql         │ OpenStreetMap (mapa)   │
                           ▼               └────────────────────────┘
                  ┌──────────────────┐
                  │ SQL Server       │
                  │ BibliotecaDB     │
                  └──────────────────┘
```
Hay **dos APIs distintas**:
1. **API externa, OpenLibrary:** de ahí salen los libros. El navegador la llama directamente.
2. **API propia, Express:** guarda y entrega lo que pertenece a la aplicación: usuarios, sesiones, votos, préstamos, stock, gustos y métricas.

## 4. Estructura de carpetas
```
src/
  main.js              entrada: crea la app con Pinia y el router
  App.vue              encabezado, menú y cierre de sesión
  router/index.js      rutas y guardias de navegación
  views/               una pantalla por ruta
  components/          piezas reutilizables (grilla, tarjeta, estrellas, mapa)
  stores/              Pinia: authStore, votosStore
  services/            lógica sin pantalla: catálogo, préstamos, métricas, cliente HTTP
server/
  index.js             arranca Express
  routes.js            todos los endpoints
  middleware.js        verificación de sesión y de rol
  db.js                conexión a SQL Server y creación de usuarios
  sql/schema.sql       tablas
tests/                 pruebas con node --test
docs/                  documentación por funcionalidad
```
La separación importante: las **vistas** muestran, los **servicios** deciden y los **stores** guardan estado compartido. Los servicios no dependen de ninguna pantalla, por eso se pueden probar con `node --test` sin navegador.

## 5. API externa: OpenLibrary
Es una API pública y gratuita, sin clave. Se usa en `src/services/bibliotecaService.js`.

### Búsqueda del catálogo
```
GET https://openlibrary.org/search.json?q=<consulta>&sort=editions&limit=80&fields=<campos>
```
La consulta se arma con los gustos del cuestionario (función `armarUrlBusqueda`):
```
subject:"science fiction" AND language:eng AND first_publish_year:[1950 TO 2000]
```
* `sort=editions`: primero las obras con más ediciones, o sea las más conocidas.
* `limit=80`: se piden de más porque después se descartan repetidos. El catálogo final tiene 40 libros.
* `fields`: se piden solo los campos necesarios (título, autor, año, páginas, puntaje, editorial, portada y las `editions`). Menos datos, respuesta más rápida.
* **Edición en el idioma elegido:** la obra original puede estar en otro idioma. Con `editions` la API devuelve la edición que cumple el filtro de idioma, y de ahí salen el título, la portada y la editorial.

### Portadas
```
https://covers.openlibrary.org/b/id/<cover_i>-M.jpg    (mediana, listado)
https://covers.openlibrary.org/b/id/<cover_i>-L.jpg    (grande, detalle)
```
Si no hay `cover_i` se usa `cover_edition_key`. Si tampoco hay, se muestra una tapa generada con el título.

### Cómo se trata la respuesta
1. Se descartan resultados sin clave o sin título, y los repetidos (misma obra o mismo título normalizado).
2. Los que tienen portada pasan primero.
3. Se cortan en 40 y se transforman al modelo propio del libro (`id`, `clave`, `titulo`, `autor`, `genero`, `portada`, `paginas`, `anioPublicacion`, `puntaje`, `editorial`, `idioma`, `ediciones`).
4. Los datos que la API no trae se completan: sin año se muestra "Clásico", sin editorial "Editorial Planeta", sin páginas un valor estimado y sin puntaje uno estimado.

### Robustez
* **Tiempo máximo de 10 segundos** (`AbortSignal.timeout`): si la API no responde se muestra el error con un botón de reintento, en lugar de quedar cargando.
* **Sin duplicar consultas:** si ya hay una consulta en curso con los mismos gustos, se reutiliza. Si se piden otros gustos, la respuesta vieja no pisa a la nueva (`claveCatalogo`, `clavePendiente`).
* **Clave estable:** cada libro se identifica con `clave` (por ejemplo `/works/OL123W`), no con `id`. El `id` es la posición en la respuesta y puede cambiar. Votos, préstamos y stock usan siempre la `clave`.

### Por qué no se guardan los libros
Los libros no están en la base: se piden a OpenLibrary cada vez. Es más simple y siempre está actualizado, pero depende de que la API responda y de que los datos estén bien cargados allá. La base solo guarda lo que le pertenece a la aplicación, y lo relaciona con el libro por su `clave`.

## 6. API propia: Express
Todas las rutas empiezan con `/api` y responden JSON. Están en `server/routes.js`.

### Cómo se autentica
1. `POST /api/auth/login` recibe `{ usuario, clave }`. Busca al usuario, compara la clave con el hash de bcrypt y, si coincide, crea una **sesión**: un token aleatorio de 32 bytes (64 caracteres hexadecimales) guardado en la tabla `Sesiones` con un vencimiento de 7 días.
2. El navegador guarda solo el token. En cada pedido lo envía en el encabezado `Authorization: Bearer <token>` (`src/services/apiClient.js`).
3. El middleware `requireAuth` busca el token en `Sesiones`. Si no existe o venció responde **401**. Si existe, deja el usuario en `req.usuario`.
4. `requireAdmin` responde **403** si el rol no es `admin` ni `dueno`.

**Por qué sesiones en la base y no JWT:** la sesión se puede cerrar desde el servidor (se borra la fila) y se puede consultar quién está conectado. Con un JWT firmado no se puede invalidar antes de que venza sin una lista aparte.

### Endpoints
| Método y ruta | Acceso | Qué hace |
|---|---|---|
| `POST /api/auth/login` | todos | Valida y crea la sesión. Devuelve `{ token, usuario }`. |
| `GET /api/auth/me` | sesión | Confirma que el token sigue vigente; se usa al recargar la página. |
| `POST /api/auth/logout` | sesión | Borra la fila de `Sesiones`. |
| `GET /api/preferencias` | sesión | Gustos del cuestionario del usuario. |
| `PUT /api/preferencias` | sesión | Guarda o actualiza los gustos (una fila por usuario). |
| `POST /api/vistos` | sesión | Registra que el usuario abrió un libro. |
| `GET /api/vistos` | sesión | Los 50 libros más recientes que vio, con la cantidad de veces. |
| `GET /api/votos` | sesión | Todos los votos con la forma `{ clave: { usuario: puntaje } }`. |
| `PUT /api/votos` | sesión | Vota o cambia el voto (de 0,5 a 5, de a media estrella). |
| `DELETE /api/votos` | admin o dueño | Borra todos los votos. |
| `GET /api/datos` | sesión | Préstamos **del usuario** y el stock. |
| `PUT /api/prestamos` | sesión | Guarda un retiro o una devolución junto con la celda de stock afectada. |
| `PUT /api/stock` | admin o dueño | Ajuste manual de stock. |
| `GET /api/admin/prestamos` | admin o dueño | Préstamos de todos los usuarios (métricas). |
| `POST /api/eventos` | todos | Registra una búsqueda; si hay sesión, guarda quién la hizo. |
| `GET /api/eventos` | admin o dueño | Búsquedas de todos los usuarios (métricas). |

Errores: 400 para datos inválidos, 401 sin sesión o sesión vencida, 403 sin permiso y 500 para fallas internas. En el 500 no se devuelve el detalle de la base al cliente.

### Seguridad
* **Contraseñas con hash** (bcrypt): en la base nunca está la clave real.
* **Consultas parametrizadas** (`.input(...)` de `mssql`): ningún dato del usuario se concatena en el SQL, lo que evita la inyección SQL.
* **Validación en el servidor:** el voto debe estar entre 0,5 y 5 en pasos de 0,5; el stock debe ser un entero mayor o igual a cero. La tabla `Votos` además tiene un `CHECK`.
* **Permisos en el servidor:** que la interfaz esconda un botón no alcanza. Las rutas de admin se verifican con `requireAdmin`.
* **Transacción** en préstamos: el préstamo y su cambio de stock se guardan juntos o no se guarda ninguno.

## 7. Base de datos
Siete tablas más `Eventos`, creadas por `server/sql/schema.sql`:

| Tabla | Clave | Relaciones |
|---|---|---|
| `Usuarios` | `id` (único: `usuario`) | |
| `Sesiones` | `token` | `id_usuario` → `Usuarios` |
| `PreferenciasLectura` | `id_usuario` | → `Usuarios` (una fila por usuario) |
| `LibrosVistos` | `id` | → `Usuarios` |
| `Votos` | (`id_usuario`, `clave_libro`) | → `Usuarios`; un voto por usuario y libro |
| `Prestamos` | `id_prestamo` | → `Usuarios` |
| `Stock` | (`clave_libro`, `id_sucursal`) | |
| `Eventos` | `id` | → `Usuarios`, opcional |

`Votos` usa clave compuesta, y por eso un usuario no puede votar dos veces el mismo libro: cambiar el voto actualiza la misma fila (`MERGE`). `Stock` solo guarda las celdas que cambiaron. Las demás se calculan en el navegador.

## 8. Cómo viaja un dato: ejemplos
### Iniciar sesión
```
LoginView ─► authStore.login ─► POST /api/auth/login ─► bcrypt compara ─► INSERT Sesiones
          ◄── { token, usuario } ◄───────────────────────────────────────┘
guarda el token ─► hidratarDatos(): GET /votos, /datos, /preferencias
```
`hidratarDatos` (en `apiClient.js`) es un registro: cada store o servicio declara con `alHidratar(fn)` qué necesita cargar, y se ejecuta al iniciar sesión y al recargar la página.

### Recargar la página
El guardia del router espera a `restaurarSesion`, que llama a `GET /api/auth/me`. Con 401 limpia la sesión. Si el servidor no responde, conserva la copia local para no echar al usuario por una caída momentánea.

### Retirar un libro
```
botón ─► BibliotecaService.retirar
       ├─ valida: sesión, libro, sucursal, stock, que no lo tenga ya prestado
       ├─ actualiza stock y préstamos en memoria y en localStorage
       └─ PUT /api/prestamos ─► transacción: MERGE Prestamos + MERGE Stock
```

### Votar
`votosStore.votar` actualiza el estado (la pantalla cambia al instante) y manda `PUT /api/votos`. El promedio combina el puntaje de OpenLibrary, que pesa como 3 votos, con los votos de los usuarios.

### Métricas del dueño
Al abrir la pantalla se vuelven a leer los votos y el stock, y se piden los préstamos y las búsquedas de **todos** los usuarios. Después, `calcularMetricas` (funciones puras en `metricasService.js`) calcula los indicadores del período elegido.

## 9. Decisiones de diseño y sus motivos
| Decisión | Motivo |
|---|---|
| Servicios y stores separados de las vistas | Se pueden probar con `node --test`, sin navegador. |
| Sesión en la base, no solo en el navegador | Sobrevive a recargas y cambio de navegador, y se puede cerrar desde el servidor. |
| Se mantiene `localStorage` además de la base | La app y los tests funcionan sin backend; sirve de copia si el servidor falla. |
| Guardado "sin esperar" (`guardarEnServidor`) | La pantalla responde al instante. Si falla, solo se avisa por consola. |
| `clave` del libro como identificador | Es estable; el `id` depende del orden de la respuesta. |
| Catálogo filtrado en OpenLibrary, no en el navegador | Se trae lo relevante en una sola consulta, en vez de miles de libros. |
| Métricas como funciones puras | Se prueban con datos fijos y se pueden mostrar con datos de demostración. |
| Hash de claves y consultas parametrizadas | Evitan los problemas de seguridad más comunes. |

## 10. Limitaciones conocidas
* **Si falla un guardado, la pantalla ya cambió:** queda una copia local, pero el servidor no se entera hasta que el usuario repita la acción.
* **Sin cifrado en el tránsito:** la clave y el token viajan por HTTP en desarrollo. En producción haría falta HTTPS.
* **Sin registro de usuarios:** solo existen `lector`, `admin` y `duenolibreria`.
* **Dependencia de OpenLibrary:** si cae o tarda, el catálogo no carga. Los géneros poco frecuentes devuelven pocos libros.
* **Amigos simulados:** `amigosService.js` usa datos de demostración, con métodos `async` para pasarlos a la API más adelante.
* **Sin tests del backend:** los tests cubren servicios, stores y métricas. Las rutas se comprueban a mano (ver `DOCUMENTACION_SETUP_BACKEND.md`).
* **Poca concurrencia:** el stock se calcula en el navegador y se guarda como valor final. Si dos usuarios retiran el último ejemplar a la vez, gana el último en guardar.

## 11. Dónde seguir leyendo
| Tema | Archivo |
|---|---|
| Puesta en marcha del backend | `DOCUMENTACION_SETUP_BACKEND.md` |
| Persistencia: tablas y sesiones en detalle | `DOCUMENTACION_PERSISTENCIA_SQL_SERVER.md` |
| Catálogo según gustos y animación de la grilla | `DOCUMENTACION_GRILLA_Y_GUSTOS.md` |
| Votos con estrellas | `DOCUMENTACION_VOTOS_ESTRELLAS.md` |
| Préstamos | `DOCUMENTACION_MULTIPLES_PRESTAMOS.md` y `DOCUMENTACION_FECHA_DEVOLUCION.md` |
| Métricas del dueño | `DOCUMENTACION_METRICAS_DUENO.md` |
| Autenticación con Pinia | `DOCUMENTACION_AUTH_PINIA.md` |

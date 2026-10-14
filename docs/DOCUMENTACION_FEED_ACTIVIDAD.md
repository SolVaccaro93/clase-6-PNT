# Documentación Técnica: Feed de Actividad (tipo Instagram)

## 📌 Requerimiento
Tener un feed tipo Instagram para ver **cuándo leyeron los libros** el usuario y sus amigos.

## 🖥️ Qué ve el usuario
La pantalla **Mis amigos** (`/#/amigos`, requiere sesión) tiene:

* **Fila de "historias":** el avatar de cada amigo. El aro de colores indica que está leyendo algo; el aro gris, que no.
* **Pestaña Actividad** (se abre por defecto): el feed de publicaciones.
* **Pestaña Amigos:** la lista de amigos con lo que están leyendo y lo que terminaron, con sus filtros.

Cada publicación del feed muestra:
| Parte | Contenido |
|---|---|
| Cabecera | Avatar, nombre y fecha (`hoy`, `ayer`, `hace N días`, o la fecha si pasó más de una semana). Las propias llevan `(vos)`. |
| Imagen | Portada del libro con la etiqueta `📖 Empezó a leer` o `✅ Terminó de leer`. |
| Pie | Texto de la publicación, sucursal y, si lo terminó, en cuántos días lo leyó. Link **Ver libro** si está en el catálogo. |

## ⚙️ Regla de negocio
* Cada lectura genera hasta **dos publicaciones**: `empezo` (en `fecha_retiro`) y `termino` (en `fecha_devolucion`, si existe).
* Se incluyen las lecturas del usuario y las de sus amigos con amistad `aceptada`.
* Se ordenan de la más nueva a la más vieja; el mismo día, `termino` queda arriba de `empezo`.
* Las lecturas salen de los préstamos reales de la app (`BibliotecaService.obtenerPrestamos`) más los datos de demostración.

## 🛠️ Cambios en el código

### 1. `src/services/amigosService.js`
* `getFeedActividad(idUsuario)`: arma y ordena las publicaciones. Cada una tiene `id`, `tipo`, `fecha`, `nombre`, `esPropia`, `titulo`, `autor`, `sucursal`, `portada`, `id_libro` y, si es `termino`, `diasDeLectura` (calculado con `differenceInCalendarDays` de `date-fns`).
* `PORTADAS_EJEMPLO`: portadas de OpenLibrary Covers para los libros de demostración, que no están en el catálogo.

### 2. Archivo nuevo: `src/components/FeedLecturas.vue`
Recibe la prop `publicaciones` (ya ordenadas) y dibuja la columna de publicaciones. Si una portada no carga, muestra una tapa con el título y el autor.

### 3. `src/views/AmigosView.vue`
Agrega la fila de historias, las pestañas **Actividad / Amigos** y la carga del feed. Se vuelve a cargar cuando cambia el usuario o se registra un préstamo (`cambiosPrestamos`).

## ⚠️ Limitaciones
* Los amigos y parte de las lecturas son **datos de demostración** hasta que exista un backend.
* El aviso de solicitudes de amistad pendientes se quitó de la vista por ahora; `getSolicitudesPendientes` sigue disponible en el servicio.

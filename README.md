# Catálogo de Biblioteca

Trabajo práctico desarrollado con **Vue 3**, **Vite** y **Vue Router 4**. Permite explorar libros, consultar disponibilidad por sucursal, solicitar ejemplares y administrar el inventario con roles de usuario.

## Ejecutar el proyecto

La aplicación necesita **dos procesos a la vez**: el backend (API con SQL Server) y el front (Vite). Hacen falta Node.js, npm y SQL Server.

**La primera vez** hay que preparar la base de datos y el archivo `.env`. Está explicado paso a paso en [`docs/DOCUMENTACION_SETUP_BACKEND.md`](docs/DOCUMENTACION_SETUP_BACKEND.md) y resumido en [Persistencia con SQL Server](#persistencia-con-sql-server).

**Cada vez que se usa la aplicación**, con SQL Server en marcha, abrir dos terminales en la carpeta del proyecto:

| Terminal | Comando | Qué hace |
| --- | --- | --- |
| 1 | `npm run server` | Levanta el backend en `http://localhost:3001`. Debe mostrar `API lista en http://localhost:3001`. |
| 2 | `npm run dev` | Levanta el front. Abrir la dirección que indique Vite, normalmente `http://localhost:5173`. |

Tras clonar o actualizar el repositorio, ejecutar antes `npm install`. Mantener las dos terminales abiertas mientras se usa la aplicación. Sin el backend, no se puede iniciar sesión.

## Compilar

```sh
npm run build
npm run preview
```

El primer comando genera la aplicación en `dist`. El segundo permite revisar esa compilación localmente.

## Pantallas y navegación

Las rutas están definidas en `src/router/index.js` con Vue Router 4:

| Pantalla | URL | Archivo |
| --- | --- | --- |
| Inicio | `/#/` | `src/views/InicioView.vue` |
| Listado | `/#/libros` | `src/views/ListadoView.vue` |
| Detalle por ID | `/#/libros/2` | `src/views/DetalleView.vue` |
| Sucursales (mapa) | `/#/sucursales` | `src/views/SucursalesView.vue` |
| Mis amigos (requiere sesión) | `/#/amigos` | `src/views/AmigosView.vue` |
| Mis préstamos (requiere sesión) | `/#/prestamos` | `src/views/PrestamosView.vue` |
| Iniciar sesión | `/#/login` | `src/views/LoginView.vue` |
| Panel Administrador | `/#/admin` | `src/views/AdminView.vue` |
| Métricas (solo dueño) | `/#/metricas` | `src/views/MetricasView.vue` |

## Cuentas de prueba

Para evaluar la aplicación rápidamente desde la pantalla de login:

* **Lector (visita):** `lector` / `123`
* **Administrador (admin):** `admin` / `admin`
* **Dueño de la librería (dueño):** `duenolibreria` / `dueno`. Puede hacer todo lo del admin y además ve **Métricas**.

Estos usuarios los crea el backend en la tabla `Usuarios` la primera vez que arranca, con la clave guardada con hash.

## Retiro y devolución

Con sesión iniciada, elegí una sucursal con stock y pulsá **Retirar libro**. Se descuenta un ejemplar y el préstamo queda en `leyendo`. Cada usuario puede tener varios préstamos activos, pero no el mismo libro dos veces a la vez.

Desde la tarjeta del libro o **Mis préstamos**, pulsá **Devolver y terminar**. Se repone el ejemplar en la sucursal original, se registra la fecha de devolución y el estado pasa a `terminado`. El historial se conserva y se puede volver a retirar ese libro.

Los préstamos y el stock se guardan en SQL Server (tablas `Prestamos` y `Stock`) y sobreviven a recargas, cambios de sesión y de navegador. Las lecturas registradas también aparecen en Mis amigos junto con los datos de demostración.

Para verificar las reglas de préstamos: `npm test`.

## Buscador del listado

En **Listado**, el buscador por título o autor está siempre visible. El botón **Filtros** despliega el resto:

* **Editorial.**
* **Año de publicación:** desde y hasta.
* **Estrellas:** solo los libros con ese puntaje o más (3, 3,5, 4 o 4,5). Se usa el puntaje actual, que incluye los votos de los usuarios.
* **Páginas:** hasta 200, de 201 a 400, o más de 400.

El género y el idioma ya no son filtros del listado: salen del **cuestionario de gustos** y se piden a OpenLibrary ya filtrados (ver `docs/DOCUMENTACION_GRILLA_Y_GUSTOS.md`).

Los filtros se combinan: un libro aparece solo si los cumple todos. Los que están en uso se muestran como chips que se quitan con ✕, junto con la cantidad de resultados.

## Calificación con estrellas

Cada libro muestra sus estrellas en la tarjeta del listado y en el detalle, con el promedio y la cantidad de votos de usuarios, por ejemplo `★★★★☆ 3,8 (2)`. Al pasar el mouse se ve una vista previa de media en media estrella, y al hacer clic se guarda el voto. Sin sesión iniciada, el clic lleva al login y después vuelve al mismo libro.

Cada usuario tiene un voto por libro y puede cambiarlo. El promedio combina el puntaje original de OpenLibrary (que cuenta como 3 votos) con los votos de los usuarios de la app. También se puede votar con el teclado: Tab para llegar a las estrellas, flechas para elegir y Enter para votar.

Los votos se guardan en SQL Server (tabla `Votos`) y sobreviven a recargas. El administrador puede borrarlos desde el **Panel Admin** con **Reiniciar votos**, para repetir la demo.

## Mis amigos y feed de actividad

Con sesión iniciada, **Mis amigos** muestra una fila de "historias" con el avatar de cada amigo (el aro de colores indica que está leyendo algo) y dos pestañas:

* **Actividad:** feed tipo Instagram con publicaciones ordenadas por fecha. Cada una muestra quién empezó o terminó de leer un libro, cuándo, la portada, la sucursal y cuántos días tardó en leerlo. Incluye tus propias lecturas.
* **Amigos:** lista de amigos con lo que están leyendo y lo que terminaron.

Los amigos son datos de demostración; las lecturas combinan esos datos con los préstamos reales de la app.

## Documentación técnica

El detalle de cada funcionalidad está en la carpeta `docs/`:

| Tema | Archivo |
| --- | --- |
| Portadas de los libros | `docs/DOCUMENTACION_CAMBIOS_PORTADAS.md` |
| Metadatos y puntaje de los libros | `docs/DOCUMENTACION_METADATOS_LIBROS.md` |
| Múltiples préstamos | `docs/DOCUMENTACION_MULTIPLES_PRESTAMOS.md` |
| Fecha de devolución y tardanza | `docs/DOCUMENTACION_FECHA_DEVOLUCION.md` |
| Mapa de sucursales | `docs/DOCUMENTACION_MAPA_SUCURSALES.md` |
| Feed de actividad (tipo Instagram) | `docs/DOCUMENTACION_FEED_ACTIVIDAD.md` |
| Filtro por cantidad de estrellas | `docs/DOCUMENTACION_FILTRO_ESTRELLAS.md` |
| Calificación con estrellas (votos) | `docs/DOCUMENTACION_VOTOS_ESTRELLAS.md` |
| Filtro por cantidad de páginas | `docs/DOCUMENTACION_FILTRO_PAGINAS.md` |
| Libros argentinos y filtro por origen (reemplazado por el catálogo según gustos) | `docs/DOCUMENTACION_ORIGEN_LIBROS.md` |
| Panel de filtros y libros sin stock | `docs/DOCUMENTACION_FILTROS_Y_SIN_STOCK.md` |
| Perfil del dueño y métricas | `docs/DOCUMENTACION_METRICAS_DUENO.md` |
| Grilla de libros en rombos | `docs/DOCUMENTACION_GRILLA_LIBROS.md` |
| Autenticación con Pinia | `docs/DOCUMENTACION_AUTH_PINIA.md` |
| Arquitectura, tecnologías y APIs de punta a punta | `docs/DOCUMENTACION_ARQUITECTURA_Y_API.md` |
| Quiz de gustos y recomendaciones | `docs/DOCUMENTACION_QUIZ_RECOMENDACIONES.md` |
| Animación de la grilla y catálogo según gustos | `docs/DOCUMENTACION_GRILLA_Y_GUSTOS.md` |
| Persistencia con SQL Server (diseño, tablas, endpoints) | `docs/DOCUMENTACION_PERSISTENCIA_SQL_SERVER.md` |
| Puesta en marcha del backend, paso a paso | `docs/DOCUMENTACION_SETUP_BACKEND.md` |


## Persistencia con SQL Server

Los usuarios, las sesiones, los gustos del cuestionario, los libros vistos, los votos, los préstamos y el stock se guardan en SQL Server (localhost). Un backend Node + Express (carpeta `server/`) conecta la aplicación con la base.

**Preparación, la primera vez.** El detalle y los errores frecuentes están en [`docs/DOCUMENTACION_SETUP_BACKEND.md`](docs/DOCUMENTACION_SETUP_BACKEND.md).

1. `npm install`.
2. En SQL Server, habilitar **TCP/IP** en el puerto 1433 (Configuration Manager) y reiniciar el servicio.
3. En SQL Server Management Studio, ejecutar `server/sql/schema.sql`. Crea la base `BibliotecaDB` y las tablas.
4. Activar el modo de autenticación mixto y crear un login SQL, por ejemplo:
   ```sql
   CREATE LOGIN biblioteca WITH PASSWORD = 'UnaClaveSegura123!', CHECK_POLICY = OFF;
   ALTER SERVER ROLE sysadmin ADD MEMBER biblioteca;
   ```
5. Copiar `.env.example` a `.env` en la **raíz del proyecto** y completar `DB_USER` y `DB_PASSWORD` con los del login. `DB_PORT` es el puerto de SQL Server (1433) y `PORT` el del backend (3001).

**Uso diario.** `npm run server` en una terminal y `npm run dev` en otra.

La sesión es una fila de la tabla `Sesiones` (token con vencimiento de 7 días). El navegador solo guarda el token. El diseño completo está en `docs/DOCUMENTACION_PERSISTENCIA_SQL_SERVER.md`.

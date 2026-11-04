# Catálogo de Biblioteca

Trabajo práctico desarrollado con **Vue 3**, **Vite** y **Vue Router 4**. Permite explorar libros, consultar disponibilidad por sucursal, solicitar ejemplares y administrar el inventario con roles de usuario.

## Ejecutar el proyecto

Con Node.js y npm instalados, abrir una terminal en la carpeta del proyecto:

```sh
npm install
npm run dev
```

Abrir la dirección que indique Vite en la terminal, normalmente `http://localhost:5173`. Mantener la terminal abierta mientras se usa la aplicación.

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

## Cuentas de prueba

Para evaluar la aplicación rápidamente desde la pantalla de login:

* **Lector (visita):** `lector` / `123`
* **Administrador (admin):** `admin` / `admin`

## Retiro y devolución

Con sesión iniciada, elegí una sucursal con stock y pulsá **Retirar libro**. Se descuenta un ejemplar y el préstamo queda en `leyendo`. Cada usuario puede tener varios préstamos activos, pero no el mismo libro dos veces a la vez.

Desde la tarjeta del libro o **Mis préstamos**, pulsá **Devolver y terminar**. Se repone el ejemplar en la sucursal original, se registra la fecha de devolución y el estado pasa a `terminado`. El historial se conserva y se puede volver a retirar ese libro.

Los préstamos y el stock se guardan juntos en localStorage y sobreviven a recargas y cambios de sesión. Son datos locales de este navegador; el proyecto todavía no tiene un backend compartido entre dispositivos. Las lecturas registradas también aparecen en Mis amigos junto con los datos de demostración.

Para verificar las reglas de préstamos: `npm test`.

## Buscador del listado

En **Listado**, el buscador por título o autor está siempre visible. El botón **Filtros** despliega el resto:

* **Género.**
* **Editorial.**
* **Idioma.**
* **Año de publicación:** desde y hasta.
* **Estrellas:** solo los libros con ese puntaje o más (3, 3,5, 4 o 4,5). Se usa el puntaje actual, que incluye los votos de los usuarios.
* **Páginas:** hasta 200, de 201 a 400, o más de 400.
* **Origen:** Argentina u otros países, según el autor. El catálogo suma hasta 15 libros de autores argentinos a los 25 generales.

Los filtros se combinan: un libro aparece solo si los cumple todos. Los que están en uso se muestran como chips que se quitan con ✕, junto con la cantidad de resultados.

## Calificación con estrellas

Cada libro muestra sus estrellas en la tarjeta del listado y en el detalle, con el promedio y la cantidad de votos de usuarios, por ejemplo `★★★★☆ 3,8 (2)`. Al pasar el mouse se ve una vista previa de media en media estrella, y al hacer clic se guarda el voto. Sin sesión iniciada, el clic lleva al login y después vuelve al mismo libro.

Cada usuario tiene un voto por libro y puede cambiarlo. El promedio combina el puntaje original de OpenLibrary (que cuenta como 3 votos) con los votos de los usuarios de la app. También se puede votar con el teclado: Tab para llegar a las estrellas, flechas para elegir y Enter para votar.

Los votos se guardan en localStorage (`biblioteca_votos`) y sobreviven a recargas. El administrador puede borrarlos desde el **Panel Admin** con **Reiniciar votos**, para repetir la demo.

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
| Libros argentinos y filtro por origen | `docs/DOCUMENTACION_ORIGEN_LIBROS.md` |
| Panel de filtros y libros sin stock | `docs/DOCUMENTACION_FILTROS_Y_SIN_STOCK.md` |
| Grilla de libros en rombos | `docs/DOCUMENTACION_GRILLA_LIBROS.md` |
| Autenticación con Pinia | `docs/DOCUMENTACION_AUTH_PINIA.md` |

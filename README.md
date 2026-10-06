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

Con sesión iniciada, elegí una sucursal con stock y pulsá **Retirar libro**. Se descuenta un ejemplar y el préstamo queda en `leyendo`. Cada usuario puede tener un solo préstamo activo.

Desde la tarjeta del libro o **Mis préstamos**, pulsá **Devolver y terminar**. Se repone el ejemplar en la sucursal original, se registra la fecha de devolución y el estado pasa a `terminado`. El historial se conserva y se habilita otro retiro.

Los préstamos y el stock se guardan juntos en localStorage y sobreviven a recargas y cambios de sesión. Son datos locales de este navegador; el proyecto todavía no tiene un backend compartido entre dispositivos. Las lecturas registradas también aparecen en Mis amigos junto con los datos de demostración.

Para verificar las reglas de préstamos: `npm test`.

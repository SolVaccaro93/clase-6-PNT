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
| Iniciar sesión | `/#/login` | `src/views/LoginView.vue` |
| Panel Administrador | `/#/admin` | `src/views/AdminView.vue` |

## Cuentas de prueba

Para evaluar la aplicación rápidamente desde la pantalla de login:

* **Lector (visita):** `lector` / `123`
* **Administrador (admin):** `admin` / `admin`

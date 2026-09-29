# Catálogo de Biblioteca

Trabajo práctico desarrollado con Vue 3 y Vite. Permite buscar libros, filtrar por género, consultar disponibilidad por sucursal y solicitar ejemplares.

## Ejecutar el proyecto

Con Node.js y npm instalados, abrir una terminal en la carpeta `clase-6-PNT`:

```sh
npm install
npm run dev
```

Abrir la dirección que indique Vite en la terminal, normalmente `http://localhost:5173`. Mantener la terminal abierta mientras se usa la aplicación.

El proyecto necesita el servidor de Vite para procesar los componentes Vue; Go Live (Live Server) no realiza ese paso. La carga de libros desde OpenLibrary requiere conexión a Internet.

## Compilar

```sh
npm run build
npm run preview
```

El primer comando genera la aplicación en `dist`. El segundo permite revisar esa compilación localmente.

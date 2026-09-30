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

## Pantallas y navegación

Las rutas están definidas en `src/router/index.js` con Vue Router 4:

| Pantalla | URL | Archivo |
| --- | --- | --- |
| Inicio | `/#/` | `src/views/InicioView.vue` |
| Listado | `/#/libros` | `src/views/ListadoView.vue` |
| Detalle por ID | `/#/libros/2` | `src/views/DetalleView.vue` |

`App.vue` contiene el encabezado, los enlaces `RouterLink` y el espacio `RouterView` donde se muestra la pantalla actual. Cada tarjeta enlaza al detalle mediante el parámetro `id`. El detalle reutiliza `LibroCard` para consultar disponibilidad y solicitar un ejemplar.

Se usa `createWebHashHistory` para que la recarga de las pantallas no requiera reglas adicionales en el servidor. Una dirección desconocida muestra una pantalla de página no encontrada.

El servicio conserva el catálogo y el stock en memoria al navegar. Al recargar el navegador, vuelve a consultar OpenLibrary y reinicia el stock de ejemplo, como en la versión original. Los IDs numéricos se asignan según el orden de la respuesta de la API: no son identificadores permanentes de OpenLibrary.

### Comprobación manual

1. Abrir Inicio y entrar al Listado desde el menú o el enlace de bienvenida.
2. Buscar por título o autor y filtrar por género.
3. Entrar a “Ver detalle” de un libro y comprobar su título y disponibilidad.
4. Solicitar un libro con stock, volver al listado y verificar el descuento.
5. Abrir `/#/libros/2` directamente y recargar: debe cargar el detalle.
6. Cambiar el ID por `3` y comprobar que cambia el libro; probar `999` y `abc` para ver el mensaje de libro no encontrado.
7. Usar Atrás y Adelante del navegador y probar una ruta inexistente como `/#/otra`.
8. Repetir la navegación en una pantalla angosta.

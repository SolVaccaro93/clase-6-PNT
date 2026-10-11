# Documentación de Cambios: Portadas de Libros en Catálogo y Detalle

## 📌 Resumen de la Solicitud
Se solicitó agregar una imagen de portada de cada libro como **preview en el catálogo** y también integrarla en tamaño destacado dentro de la **vista de detalle** del libro.

---

## 🛠️ Archivos Modificados

### 1. `src/services/bibliotecaService.js`
* **Objetivo:** Obtener las imágenes oficiales desde la API de **OpenLibrary Covers**.
* **Detalle del cambio:**
  * Al procesar los resultados de `https://openlibrary.org/search.json?q=novela&limit=25`, OpenLibrary provee las propiedades `cover_i` (ID numérico de la portada) y `cover_edition_key` (código de edición).
  * Se construyeron dos URLs dinámicas por libro:
    * `portada`: URL con sufijo `-M.jpg` (tamaño mediano, optimizado para preview en tarjetas del catálogo).
    * `portadaGrande`: URL con sufijo `-L.jpg` (tamaño grande de alta resolución, optimizado para la vista de detalle).
  * Si la API no provee portada, ambos campos quedan en `null` de forma segura para no romper la aplicación.

```javascript
// Obtención de portadas desde la API de OpenLibrary Covers
let portada = null;
let portadaGrande = null;
if (doc.cover_i) {
  portada = `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`;
  portadaGrande = `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`;
} else if (doc.cover_edition_key) {
  portada = `https://covers.openlibrary.org/b/olid/${doc.cover_edition_key}-M.jpg`;
  portadaGrande = `https://covers.openlibrary.org/b/olid/${doc.cover_edition_key}-L.jpg`;
}

return {
  id: index + 1,
  clave: doc.key,
  titulo: doc.title,
  autor: doc.author_name ? doc.author_name[0] : "Autor desconocido",
  genero: genero,
  portada,
  portadaGrande
};
```

---

### 2. `src/components/LibroCard.vue`
* **Objetivo:** Renderizar la portada tanto en el listado (`ListadoView`) como en la vista de detalle (`DetalleView`).
* **Detalle del cambio:**
  * **Lógica Reactiva:**
    * `portadaUrl`: propiedad computada que selecciona automáticamente la imagen mediana (`portada`) en el catálogo (`mostrarDetalle === true`), o la imagen de alta resolución (`portadaGrande`) en la vista de detalle (`mostrarDetalle === false`).
    * `imagenFallida`: estado reactivo que detecta si la URL de la portada falla al cargar (`@error="imagenFallida = true"`), reseteándose automáticamente al cambiar de libro.
  * **Template y Fallback Inteligente:**
    * Si la imagen está disponible y carga correctamente, se renderiza con `loading="lazy"` para máxima performance de red.
    * Si el libro no tiene portada o la imagen arroja error 404, se muestra un diseño alternativo elegante con ícono de libro (`📖`), título y autor, conservando la estética del catálogo sin mostrar iconos rotos del navegador.
  * **Diseño y Estilos CSS:**
    * **En el Catálogo (Preview):** Contenedor de 200px de altura con fondo oscuro degradado, bordes redondeados, sombra sutil y efecto de zoom suave (`transform: scale(1.04)`) al pasar el cursor sobre la tarjeta.
    * **En la Vista Detalle:** Contenedor expandido a 290px de alto (`portada-detalle`), centrado y con sombra de mayor profundidad para resaltar el ejemplar seleccionado.

```html
<!-- Portada del libro (Preview en catálogo / Portada destacada en detalle) -->
<div class="portada-contenedor" :class="{ 'portada-detalle': !mostrarDetalle }">
  <img
    v-if="portadaUrl && !imagenFallida"
    :src="portadaUrl"
    :alt="`Portada del libro ${libro.titulo}`"
    class="portada-img"
    loading="lazy"
    @error="imagenFallida = true"
  />
  <div v-else class="portada-fallback" aria-hidden="true">
    <span class="fallback-icono">📖</span>
    <span class="fallback-titulo">{{ libro.titulo }}</span>
    <span class="fallback-autor">{{ libro.autor }}</span>
  </div>
</div>
```

---

## 🔍 Beneficios para el Usuario
1. **Navegación Visual:** El catálogo ahora luce profesional como una librería real, facilitando identificar los libros visualmente.
2. **Experiencia en Detalle:** Al pulsar en *Ver detalle →*, la portada se presenta en formato póster destacado de mayor definición junto con la disponibilidad en el mapa interactivo.
3. **Resiliencia Total (Fallback):** Si un libro no tiene portada o falla la conexión con el servidor de OpenLibrary Covers, la aplicación muestra una elegante portada estilizada con el título, sin romper el layout ni el diseño visual.
4. **Cero Impacto en Pruebas Existentes:** Todos los tests de stock, préstamos y persistencia continúan ejecutándose y pasando al 100% (`npm test`).

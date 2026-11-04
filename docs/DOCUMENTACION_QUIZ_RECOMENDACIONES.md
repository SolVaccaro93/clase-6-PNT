# Quiz de gustos y recomendaciones

En el listado, el quiz pregunta por género, idioma y rango de años de publicación. Las opciones de género e idioma se obtienen del catálogo disponible; el rango incluye ambos extremos y comienza sugerido entre 1950 y 2000.

Al finalizar, las preferencias se guardan en `localStorage` para la próxima visita. Los libros que coinciden con más respuestas aparecen primero; los resultados parciales también quedan visibles y los empates conservan el orden del catálogo. Los filtros y la búsqueda del listado siguen aplicándose sobre esos resultados.

El botón **Cambiar gustos** permite completar el quiz otra vez. Si el catálogo ya no incluye el género o el idioma guardado, se solicita volver a elegir las preferencias.

# Quiz de gustos y recomendaciones

En el listado, el quiz pregunta por género, idioma y rango de años de publicación. Las opciones de género e idioma son listas fijas (`GENEROS_QUIZ` e `IDIOMAS_QUIZ`, en `bibliotecaService.js`); el rango incluye ambos extremos y comienza sugerido entre 1950 y 2000.

Al finalizar, las respuestas se usan para **pedir a OpenLibrary los libros que coinciden** (ver `DOCUMENTACION_GRILLA_Y_GUSTOS.md`) y se guardan para la próxima visita:
* en `localStorage`, como copia local;
* en la tabla `PreferenciasLectura` de SQL Server, si hay sesión iniciada (ver `DOCUMENTACION_PERSISTENCIA_SQL_SERVER.md`). Al iniciar sesión se leen de la base, así que acompañan al usuario en otro navegador.

Los libros que coinciden con más respuestas aparecen primero (`ordenarPorPreferencias`); los empates conservan el orden del catálogo. Los filtros y la búsqueda del listado siguen aplicándose sobre esos resultados.

El botón **Cambiar gustos** permite completar el quiz otra vez, lo que vuelve a consultar a la API. Si los gustos guardados tienen un género o idioma que ya no existe en las listas, se solicita volver a elegirlos.

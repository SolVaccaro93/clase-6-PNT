# Documentación Técnica: Múltiples Préstamos

## 📌 Requerimiento
Antes cada usuario podía tener **un solo** libro activo y tenía que devolverlo para retirar otro. Ahora puede tener **varios libros prestados a la vez**, cada uno con su propia fecha límite y su contador de días (ver [DOCUMENTACION_FECHA_DEVOLUCION.md](DOCUMENTACION_FECHA_DEVOLUCION.md)).

## ⚙️ Regla de negocio
* Se pueden retirar todos los libros distintos que se quiera, mientras haya stock.
* **No** se puede retirar el mismo libro dos veces mientras siga prestado. Error: `Ya tenés este libro prestado. Devolvelo antes de retirarlo de nuevo.`
* Al devolverlo, ese libro se puede volver a retirar.

## 🛠️ Cambios en el código

### 1. `src/services/bibliotecaService.js`
`obtenerPrestamoActivo()` devolvía **un solo** préstamo. Se reemplazó por dos funciones:
* `obtenerPrestamosActivos()` – **lista** de préstamos sin devolver del usuario.
* `obtenerPrestamoActivoDeLibro(clave)` – el préstamo activo de **un libro puntual**, o `null`.

```diff
-  obtenerPrestamoActivo() {
-    return this.obtenerPrestamos().find((p) => p.fecha_devolucion === null) || null;
+  obtenerPrestamosActivos() {
+    return this.obtenerPrestamos().filter((p) => p.fecha_devolucion === null);
+  },
+
+  obtenerPrestamoActivoDeLibro(claveLibro) {
+    return this.obtenerPrestamosActivos().find((p) => p.clave_libro === claveLibro) || null;
   },
```

En `retirar()` se quitó el bloqueo general y se agregó el control por libro. Va después de buscar el libro, porque necesita su `clave`:
```diff
   retirar(libroId, sucursalId) {
     const idUsuario = usuarioActual();
-    if (this.obtenerPrestamoActivo()) {
-      throw new Error("Ya tenés un libro activo. Devolvelo antes de retirar otro.");
-    }
     const idLibroNum = Number(libroId);
     const idSucursalNum = Number(sucursalId);
     const libro = this.getLibroPorId(idLibroNum);
     const sucursal = SUCURSALES.find((s) => s.id === idSucursalNum);
     if (!libro || !sucursal) throw new Error("El libro o la sucursal no existen.");
+    if (this.obtenerPrestamoActivoDeLibro(libro.clave)) {
+      throw new Error("Ya tenés este libro prestado. Devolvelo antes de retirarlo de nuevo.");
+    }
```

### 2. `src/components/LibroCard.vue`
Antes la tarjeta buscaba "el" préstamo activo y comparaba si era de este libro. Ahora le pregunta directamente al servicio por el préstamo de este libro:
```diff
-const prestamoActivo = computed(() => BibliotecaService.obtenerPrestamoActivo());
-const prestamoDelLibro = computed(() => prestamoActivo.value?.clave_libro === props.libro.clave ? prestamoActivo.value : null);
+const prestamoDelLibro = computed(() => BibliotecaService.obtenerPrestamoActivoDeLibro(props.libro.clave));
```

Se quitó el aviso que impedía retirar si había otro libro activo. Ahora, si el libro está prestado, se muestra **Devolver y terminar**; si no, el selector de sucursal:
```diff
     <div v-if="prestamoDelLibro" class="acciones">
       ...
       <button @click="devolver">Devolver y terminar</button>
     </div>
-    <p v-else-if="prestamoActivo" role="status">
-      Ya tenés un libro activo: {{ prestamoActivo.titulo }}.
-      <RouterLink :to="{ name: 'prestamos' }">Devolver desde Mis préstamos</RouterLink>
-    </p>
     <div v-else class="acciones">
```

### 3. `src/views/PrestamosView.vue`
Solo cambió el texto de ayuda:
```diff
-    <p>Podés tener un libro activo durante {{ DIAS_PRESTAMO }} días. Al devolverlo pasa de leyendo a terminado.</p>
+    <p>Podés tener varios libros a la vez; cada préstamo dura {{ DIAS_PRESTAMO }} días. Al devolverlo pasa de leyendo a terminado.</p>
```

### 4. `README.md`
```diff
-... Cada usuario puede tener un solo préstamo activo.
+... Cada usuario puede tener varios préstamos activos, pero no el mismo libro dos veces a la vez.

-... El historial se conserva y se habilita otro retiro.
+... El historial se conserva y se puede volver a retirar ese libro.
```

### 5. `tests/prestamos.test.js`
Las llamadas a `obtenerPrestamoActivo()` pasaron a usar la lista:
```diff
-  assert.equal(biblioteca.obtenerPrestamoActivo(), null);
+  assert.equal(biblioteca.obtenerPrestamosActivos().length, 0);
```

Se reemplazó la prueba de "un solo libro activo" por la nueva regla: no se puede retirar el mismo libro dos veces, pero sí dos libros distintos. Primero se suma stock con `actualizarStock`, porque el libro 1 del test no tiene stock:
```diff
-  assert.throws(() => biblioteca.retirar(2, 1), /activo/);
-  assert.throws(() => biblioteca.retirar(1, 2), /activo/);
+  assert.throws(() => biblioteca.retirar(2, 1), /prestado/);
   assert.equal(cantidad(), original - 1);
+  // Se pueden tener varios libros distintos prestados a la vez.
+  biblioteca.actualizarStock(1, 1, 1);
+  const otro = biblioteca.retirar(1, 1);
+  assert.equal(biblioteca.obtenerPrestamosActivos().length, 2);
+  biblioteca.devolver(otro.id_prestamo);
+  assert.equal(biblioteca.obtenerPrestamosActivos().length, 1);
```

```bash
npm test
```

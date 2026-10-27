# Documentación Técnica: Autenticación con Pinia

## 📌 Requerimiento
Que la sesión de usuario (login, logout y rol) viva en un **store de Pinia** en vez de en un servicio propio. Es el tema de la clase 10: usar Pinia para el login y evaluar qué otras cosas conviene tener en el store.

## 📦 Herramienta utilizada: `pinia`
Pinia ya estaba en `package.json`, pero no se usaba. No hizo falta instalar nada nuevo.

Conceptos usados:
| Concepto | Para qué |
|---|---|
| `defineStore` | Define el store: recibe un id (`"auth"`) y una función. |
| `ref` | Estado reactivo (el usuario logueado). |
| `computed` | Getters (`estaAutenticado`, `esAdmin`). |
| `createPinia` | Se registra en `main.js`; sin esto `useAuthStore()` falla. |
| `setActivePinia` | Se usa solo en los tests, que corren en Node sin app de Vue. |

## ⚙️ Por qué esto va en un store
Siguiendo el criterio de la clase:
* **¿Más de un componente necesita el dato?** Sí: `App.vue`, `LoginView`, `AdminView`, `AmigosView`, `LibroCard`, el router y `bibliotecaService`.
* **¿Con qué frecuencia cambia?** Poco: solo en login y logout.

Se usó la forma de **setup store** (funciones), donde el estado es un `ref`, los getters son `computed` y las acciones son funciones comunes.

| Pieza | `AuthService` (antes) | `authStore` (ahora) |
|---|---|---|
| Estado | `estado.usuarioActual` (`reactive`) | `usuario` (`ref`) |
| Getters | métodos `estaAutenticado()` y `esAdmin()` | `computed`, se usan **sin paréntesis** |
| Acciones | `login`, `logout`, `obtenerUsuariosDemo` | las mismas funciones |

**El comportamiento no cambia:** mismos usuarios (`lector` y `admin`), mismos roles, `login` tira un `Error` si las credenciales son incorrectas y la sesión sigue guardándose en `localStorage` (clave `biblioteca_usuario`). Pinia no persiste nada por sí sola, por eso se lee y se escribe a mano.

## 🛠️ Cambios en el código

### 1. Archivo nuevo: `src/stores/authStore.js`
```javascript
// =========================================================================
// Requerimiento: Login y sesión por usuario (con rol visita y admin)
// Store de Pinia: reemplaza al antiguo AuthService (services/authService.js)
// =========================================================================
import { defineStore } from "pinia";
import { computed, ref } from "vue";

// Clave con la que se guarda la sesión en localStorage
const CLAVE_SESION = "biblioteca_usuario";

// Usuarios de prueba preconfigurados para facilitar la corrección y el uso.
// Es una constante fija (no cambia nunca), por eso queda afuera del store
// y no necesita ser reactiva.
const USUARIOS_PREDEFINIDOS = [
  {
    usuario: "lector",
    clave: "123",
    nombre: "Sol Vaccaro",
    rol: "visita" // Rol común: puede ver catálogo y pedir libros
  },
  {
    usuario: "admin",
    clave: "admin",
    nombre: "Matías Gratz",
    rol: "admin" // Rol administrador: tiene acceso al panel de gestión
  }
];

// defineStore recibe el id del store ("auth") y una función (setup store):
// todo lo que se declara adentro y se devuelve con return queda expuesto.
export const useAuthStore = defineStore("auth", () => {
  // STATE: usuario logueado o null. Arranca leyendo localStorage para
  // que la sesión no se pierda al recargar la página.
  const usuario = ref(JSON.parse(localStorage.getItem(CLAVE_SESION) || "null"));

  // GETTERS: son computed, se recalculan solos cuando cambia "usuario".
  // Se usan como propiedades, SIN paréntesis: authStore.esAdmin
  const estaAutenticado = computed(() => usuario.value !== null);
  const esAdmin = computed(() => usuario.value?.rol === "admin");

  // ACTIONS: funciones comunes. Dentro del store se accede al estado con .value

  // Iniciar sesión con usuario y contraseña
  function login(username, password) {
    const usuarioEncontrado = USUARIOS_PREDEFINIDOS.find(
      (u) => u.usuario.toLowerCase() === username.trim().toLowerCase() && u.clave === password
    );

    if (!usuarioEncontrado) {
      throw new Error("Usuario o contraseña incorrectos.");
    }

    // Guardamos los datos del usuario en el estado (sin la clave)
    usuario.value = {
      usuario: usuarioEncontrado.usuario,
      nombre: usuarioEncontrado.nombre,
      rol: usuarioEncontrado.rol
    };

    // Persistimos en localStorage para que no se pierda al recargar la página
    localStorage.setItem(CLAVE_SESION, JSON.stringify(usuario.value));

    return usuario.value;
  }

  // Cerrar la sesión actual
  function logout() {
    usuario.value = null;
    localStorage.removeItem(CLAVE_SESION);
  }

  // Lista de usuarios demo para mostrar ayuda en la pantalla de login
  function obtenerUsuariosDemo() {
    return USUARIOS_PREDEFINIDOS;
  }

  // Todo lo que no se devuelva acá no es accesible desde afuera
  return { usuario, estaAutenticado, esAdmin, login, logout, obtenerUsuariosDemo };
});
```

**Cómo funciona, paso a paso:**
1. Al pedir el store por primera vez, se ejecuta la función y se crea el estado leyendo `localStorage`.
2. `login` busca el usuario, y si existe guarda `{ usuario, nombre, rol }` en el estado y en `localStorage`.
3. Los getters (`estaAutenticado`, `esAdmin`) se recalculan solos cuando cambia `usuario`, así que los componentes se actualizan sin hacer nada extra.
4. `logout` vacía el estado y borra la sesión guardada.

### 2. Archivo modificado: `src/main.js`
Se registra Pinia (antes que el router):
```diff
 import { createApp } from 'vue'
+import { createPinia } from 'pinia'
 import './style.css'
 import App from './App.vue'
 import router from './router'

-createApp(App).use(router).mount('#app')
+createApp(App).use(createPinia()).use(router).mount('#app')
```

### 3. Archivo modificado: `src/router/index.js`
El store se pide **adentro** del guardia, no arriba del archivo: así se ejecuta recién al navegar, cuando Pinia ya está instalada.
```diff
-import { AuthService } from "../services/authService.js";
+import { useAuthStore } from "../stores/authStore.js";
 ...
 router.beforeEach((to, from, next) => {
-  if (to.meta.requiresAuth && !AuthService.estaAutenticado()) {
+  const authStore = useAuthStore();
+
+  if (to.meta.requiresAuth && !authStore.estaAutenticado) {
 ...
-    if (!AuthService.esAdmin()) {
+    if (!authStore.esAdmin) {
```

### 4. Archivo modificado: `src/services/bibliotecaService.js`
Es un archivo JS común (no un componente), pero puede usar el store si lo llama **dentro** de las funciones:
```diff
-import { AuthService } from "./authService.js";
+import { useAuthStore } from "../stores/authStore.js";
 ...
 function usuarioActual() {
-  if (!AuthService.usuario) throw new Error("Iniciá sesión para gestionar tus préstamos.");
-  return AuthService.usuario.usuario;
+  const authStore = useAuthStore();
+  if (!authStore.usuario) throw new Error("Iniciá sesión para gestionar tus préstamos.");
+  return authStore.usuario.usuario;
 }
 ...
-  obtenerPrestamos(idUsuario = AuthService.usuario?.usuario) {
+  obtenerPrestamos(idUsuario = useAuthStore().usuario?.usuario) {
```

### 5. Archivos modificados: componentes y vistas
En todos se reemplaza el import y se pide el store con `const authStore = useAuthStore()`. Los nombres que usa el template (`usuario`, `esAdmin`) se mantienen con `computed`, así no hubo que tocar el HTML.

| Archivo | Antes | Ahora |
|---|---|---|
| `App.vue` | `computed(() => AuthService.usuario)` | `computed(() => authStore.usuario)` |
| `App.vue` | `computed(() => AuthService.esAdmin())` | `computed(() => authStore.esAdmin)` |
| `App.vue` | `AuthService.logout()` | `authStore.logout()` |
| `AdminView.vue` | `AuthService.esAdmin()` / `AuthService.usuario` | `authStore.esAdmin` / `authStore.usuario` |
| `AmigosView.vue` | `AuthService.usuario` | `authStore.usuario` |
| `LibroCard.vue` | `!AuthService.estaAutenticado()` | `!authStore.estaAutenticado` |
| `LoginView.vue` | `AuthService.login(...)` | `authStore.login(...)` |

```diff
-import { AuthService } from "./services/authService.js";
+import { useAuthStore } from "./stores/authStore.js";
 ...
-const usuario = computed(() => AuthService.usuario);
-const esAdmin = computed(() => AuthService.esAdmin());
+const authStore = useAuthStore();
+const usuario = computed(() => authStore.usuario);
+const esAdmin = computed(() => authStore.esAdmin);
```
> Importante: `estaAutenticado` y `esAdmin` ahora son `computed`, así que se usan **sin paréntesis**. Con paréntesis tira "is not a function".

### 6. Archivo modificado: `tests/prestamos.test.js`
El test corre en Node, sin una app de Vue, así que hay que activar un Pinia a mano. Se hace después de los mocks de `localStorage` y `fetch`:
```diff
+import { setActivePinia, createPinia } from "pinia";
 ...
-  const { AuthService } = await import("../src/services/authService.js");
+  setActivePinia(createPinia());
+  const { useAuthStore } = await import("../src/stores/authStore.js");
+  const authStore = useAuthStore();
 ...
-  AuthService.login("lector", "123");
+  authStore.login("lector", "123");
```
(Lo mismo para `logout()` y los otros `login`.)

### 7. Archivo eliminado: `src/services/authService.js`
Se borró para que no queden dos sesiones distintas dando vueltas.

## ✅ Cómo probarlo
```bash
npm test
npm run build
npm run dev
```
En el navegador:
1. Iniciar sesión como `lector` / `123` y como `admin` / `admin`.
2. Recargar la página: la sesión se mantiene.
3. Entrar a `/#/admin` sin sesión y como `lector`: redirige al login con `?redirect=`.
4. Entrar a `/#/admin` como `admin`: deja pasar.
5. Cerrar sesión y entrar a `/#/prestamos`: redirige al login.

## 🔭 Qué más podría ir al store
Aplicando el mismo criterio (¿lo necesitan varios componentes? ¿con qué frecuencia cambia?), se podrían evaluar a futuro los préstamos y el stock de `bibliotecaService`, que hoy usan contadores reactivos (`cambiosStock`, `cambiosPrestamos`) para avisarle a Vue que algo cambió.
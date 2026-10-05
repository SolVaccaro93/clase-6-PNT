<script setup>
import { ref, computed, onMounted } from "vue";
import { BibliotecaService, SUCURSALES } from "../services/bibliotecaService.js";
import { AuthService } from "../services/authService.js";

// Verificamos si el usuario actual es administrador
const esAdmin = computed(() => AuthService.esAdmin());
const usuario = computed(() => AuthService.usuario);

const librosStock = ref([]);
const filtroLibro = ref("");
const isLoading = ref(true);

async function cargarDatosAdmin() {
  isLoading.value = true;
  try {
    await BibliotecaService.cargarLibros(25);
    librosStock.value = BibliotecaService.obtenerTodoElStock();
  } finally {
    isLoading.value = false;
  }
}

// Modificar stock en tiempo real (+1 o -1)
function modificarStock(libroId, sucursalId, cambio) {
  BibliotecaService.actualizarStock(libroId, sucursalId, cambio);
  librosStock.value = BibliotecaService.obtenerTodoElStock();
}

// Filtro rápido de libros por título o autor
const librosFiltrados = computed(() => {
  if (!filtroLibro.value.trim()) return librosStock.value;
  const q = filtroLibro.value.toLowerCase();
  return librosStock.value.filter(
    (item) =>
      item.libro.titulo.toLowerCase().includes(q) ||
      item.libro.autor.toLowerCase().includes(q)
  );
});

// Métricas de inventario para el administrador
const totalEjemplares = computed(() => {
  return librosStock.value.reduce((total, item) => {
    return total + item.stockPorSucursal.reduce((sub, s) => sub + s.cantidad, 0);
  }, 0);
});

onMounted(() => {
  cargarDatosAdmin();
});
</script>

<template>
  <section class="admin-contenedor" aria-labelledby="titulo-admin">
    <!-- Bloque de permiso denegado si no es administrador -->
    <div v-if="!esAdmin" class="acceso-denegado" role="alert">
      <span class="icono-alerta">🚫</span>
      <h2>Acceso Restringido</h2>
      <p>Esta sección es exclusiva para usuarios con rol <strong>admin</strong>.</p>
      <p v-if="usuario">
        Actualmente estás conectado como <strong>{{ usuario.usuario }}</strong> (rol: <code>{{ usuario.rol }}</code>).
      </p>
      <p v-else>No has iniciado sesión en el sistema.</p>
      <RouterLink :to="{ name: 'login', query: { redirect: '/admin' } }" class="btn-ir-login">
        Iniciar sesión como Administrador
      </RouterLink>
    </div>

    <!-- Requerimiento: Panel y permisos diferenciados para administrador - Matías -->
    <div v-else class="panel-admin">
      <div class="header-admin">
        <div>
          <h2 id="titulo-admin">⚙️ Panel de Administración</h2>
          <p class="subtitulo">Gestión de inventario y stock por sucursal en tiempo real.</p>
        </div>
        <div class="usuario-admin-tag">
          👤 Administrador: <strong>{{ usuario.nombre }}</strong>
        </div>
      </div>

      <!-- Tarjetas de métricas rápidas -->
      <div class="metricas-admin">
        <div class="tarjeta-kpi">
          <span class="kpi-num">{{ librosStock.length }}</span>
          <span class="kpi-desc">Títulos en Catálogo</span>
        </div>
        <div class="tarjeta-kpi">
          <span class="kpi-num">{{ totalEjemplares }}</span>
          <span class="kpi-desc">Ejemplares Totales</span>
        </div>
        <div class="tarjeta-kpi">
          <span class="kpi-num">{{ SUCURSALES.length }}</span>
          <span class="kpi-desc">Sucursales Activas</span>
        </div>
      </div>

      <!-- Sección de Gestión de Stock -->
      <section class="seccion-stock">
        <div class="barra-stock-header">
          <h3>📦 Control de Stock por Sucursal</h3>
          <input
            v-model="filtroLibro"
            type="text"
            placeholder="Filtrar por título..."
            class="input-filtro"
          />
        </div>

        <div class="tabla-contenedor">
          <table class="tabla-stock">
            <thead>
              <tr>
                <th>ID</th>
                <th>Título</th>
                <th v-for="suc in SUCURSALES" :key="suc.id">
                  {{ suc.nombre }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in librosFiltrados" :key="item.libro.id">
                <td class="col-id">{{ item.libro.id }}</td>
                <td class="col-titulo">
                  <strong>{{ item.libro.titulo }}</strong>
                  <span class="autor-dim">{{ item.libro.autor }}</span>
                </td>
                <td v-for="suc in item.stockPorSucursal" :key="suc.sucursal.id" class="col-stock">
                  <div class="control-cantidad">
                    <button
                      class="btn-ajuste"
                      :disabled="suc.cantidad <= 0"
                      @click="modificarStock(item.libro.id, suc.sucursal.id, -1)"
                      title="Disminuir stock"
                    >
                      -
                    </button>
                    <span class="num-stock" :class="{ cero: suc.cantidad === 0 }">
                      {{ suc.cantidad }}
                    </span>
                    <button
                      class="btn-ajuste"
                      @click="modificarStock(item.libro.id, suc.sucursal.id, 1)"
                      title="Aumentar stock"
                    >
                      +
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </section>
</template>

<style scoped>
.admin-contenedor {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.acceso-denegado {
  background-color: #242936;
  border: 1px solid #bf616a;
  border-radius: 10px;
  padding: 36px;
  text-align: center;
  max-width: 500px;
  margin: 40px auto;
}

.icono-alerta {
  font-size: 3rem;
  display: block;
  margin-bottom: 12px;
}

.acceso-denegado h2 {
  color: #bf616a;
  margin: 0 0 10px;
}

.acceso-denegado code {
  color: #88c0d0;
  background-color: #1e222d;
  padding: 2px 6px;
  border-radius: 4px;
}

.btn-ir-login {
  display: inline-block;
  margin-top: 16px;
  background-color: #5e81ac;
  color: white;
  padding: 10px 18px;
  border-radius: 6px;
  text-decoration: none;
  font-weight: bold;
}

.header-admin {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.header-admin h2 {
  margin: 0;
  color: #ffffff;
  font-size: 1.5rem;
}

.subtitulo {
  margin: 4px 0 0;
  color: #d8dee9;
  font-size: 0.9rem;
}

.usuario-admin-tag {
  background-color: #3b4252;
  border: 1px solid #88c0d0;
  color: #eceff4;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.85rem;
}

.metricas-admin {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
}

.tarjeta-kpi {
  background-color: #242936;
  border: 1px solid #3b4252;
  border-radius: 8px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.kpi-num {
  font-size: 1.8rem;
  font-weight: bold;
  color: #88c0d0;
}

.kpi-desc {
  font-size: 0.8rem;
  color: #d8dee9;
}

.seccion-stock {
  background-color: #242936;
  border: 1px solid #3b4252;
  border-radius: 8px;
  padding: 18px;
}

.barra-stock-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 14px;
}

.barra-stock-header h3 {
  margin: 0;
  color: #88c0d0;
  font-size: 1.15rem;
}

.input-filtro {
  max-width: 240px;
  padding: 6px 10px;
  font-size: 0.85rem;
}

.tabla-contenedor {
  overflow-x: auto;
}

.tabla-stock {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.tabla-stock th, .tabla-stock td {
  padding: 10px;
  border-bottom: 1px solid #3b4252;
  text-align: left;
}

.tabla-stock th {
  background-color: #1e222d;
  color: #88c0d0;
  font-weight: 600;
}

.col-id {
  width: 40px;
  color: #88c0d0;
}

.col-titulo {
  min-width: 200px;
}

.autor-dim {
  display: block;
  font-size: 0.75rem;
  color: #d8dee9;
}

.col-stock {
  text-align: center;
  width: 120px;
}

.control-cantidad {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.btn-ajuste {
  width: 26px;
  height: 26px;
  min-height: 26px;
  padding: 0;
  border-radius: 4px;
  background-color: #3b4252;
  color: white;
  border: 1px solid #4c566a;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
}

.btn-ajuste:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.num-stock {
  min-width: 24px;
  text-align: center;
  font-weight: bold;
}

.num-stock.cero {
  color: #bf616a;
}
</style>

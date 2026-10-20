<script setup>
// =========================================================================
// Requerimiento: Botones 'Me gusta' / 'No me gusta' - Sol
// =========================================================================
import { computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { VotosService } from "../services/votosService.js";
import { AuthService } from "../services/authService.js";

const props = defineProps({
  libro: { type: Object, required: true }
});

const router = useRouter();
const route = useRoute();

const conteo = computed(() => VotosService.contar(props.libro.clave));
const miVoto = computed(() => VotosService.votoDelUsuario(props.libro.clave));

function votar(tipo) {
  // Usuario anónimo: al login con retorno exacto a esta pantalla
  if (!AuthService.estaAutenticado()) {
    router.push({ name: "login", query: { redirect: route.fullPath } });
    return;
  }
  VotosService.votar(props.libro.clave, tipo);
}
</script>

<template>
  <div class="votos" role="group" :aria-label="`Valoración de ${libro.titulo}`">
    <button
      type="button"
      class="btn-voto"
      :class="{ activo: miVoto === 'like', like: true }"
      :aria-pressed="miVoto === 'like'"
      @click="votar('like')"
    >
      👍 <span class="sr-only">Me gusta: </span>{{ conteo.likes }}
    </button>
    <button
      type="button"
      class="btn-voto"
      :class="{ activo: miVoto === 'dislike', dislike: true }"
      :aria-pressed="miVoto === 'dislike'"
      @click="votar('dislike')"
    >
      👎 <span class="sr-only">No me gusta: </span>{{ conteo.dislikes }}
    </button>
    <span
      class="neto"
      :class="{ positivo: conteo.neto > 0, negativo: conteo.neto < 0 }"
      title="Puntaje neto (me gusta − no me gusta)"
    >
      Puntaje: {{ conteo.neto > 0 ? "+" : "" }}{{ conteo.neto }}
    </span>
  </div>
</template>

<style scoped>
.votos {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.btn-voto {
  min-height: 36px;
  padding: 4px 12px;
  background-color: var(--color-surface-alt);
  border: 1px solid var(--color-border-light);
  color: var(--color-text);
  font-weight: 600;
}

.btn-voto:hover {
  background-color: var(--color-border);
}

.btn-voto.like.activo {
  background-color: color-mix(in srgb, var(--color-success) 25%, transparent);
  border-color: var(--color-success);
}

.btn-voto.dislike.activo {
  background-color: color-mix(in srgb, var(--color-danger) 25%, transparent);
  border-color: var(--color-danger);
}

.neto {
  margin-left: auto;
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.neto.positivo {
  color: var(--color-success);
}

.neto.negativo {
  color: var(--color-danger);
}
</style>

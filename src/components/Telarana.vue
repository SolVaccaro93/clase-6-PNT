<script setup>
// =========================================================================
// Telaraña decorativa (tema Halloween)
// =========================================================================
// Solo dibuja la figura: la POSICIÓN y el TAMAÑO los define quien la usa,
// con una clase propia. Así la misma telaraña sirve para la esquina de la
// página y para las esquinas del bloque de bienvenida.
//
// La telaraña se dibuja apuntando a la esquina SUPERIOR IZQUIERDA. Para la
// otra esquina se espeja con CSS (transform: scaleX(-1)).
//
// stroke="currentColor" significa "usá el color de texto que tengas".
// Gracias a eso el color se define por CSS y sigue nuestra paleta.
</script>

<template>
  <svg class="telarana" viewBox="0 0 100 100" aria-hidden="true">
    <g fill="none" stroke="currentColor" stroke-width="1.2">
      <!-- Hilos radiales: salen de la esquina como un abanico -->
      <path d="M0 0 L100 0 M0 0 L85 40 M0 0 L62 62 M0 0 L40 85 M0 0 L0 100" />
      <!-- Arcos que unen los hilos (las "vueltas" de la tela) -->
      <path d="M28 0 Q20 20 0 28 M52 0 Q38 38 0 52 M76 0 Q56 56 0 76 M100 0 Q74 74 0 100" />
    </g>
  </svg>
</template>

<style scoped>
.telarana {
  /* Decorativa: nunca debe interferir con los clics del usuario */
  pointer-events: none;
}
</style>

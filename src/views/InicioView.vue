<script setup>
import Telarana from "../components/Telarana.vue";
</script>

<template>
  <section class="bienvenida" aria-labelledby="titulo-inicio">
    <!-- Telarañas en las dos esquinas de arriba (mismo componente, espejado) -->
    <Telarana class="telarana-hero telarana-izq" />
    <Telarana class="telarana-hero telarana-der" />

    <!-- Fantasma que flota junto a la ilustración -->
    <span class="fantasma" aria-hidden="true">👻</span>

    <div class="bienvenida-ilustracion" aria-hidden="true">
      <svg viewBox="0 0 240 150" fill="none">
        <circle cx="120" cy="75" r="68" fill="var(--color-surface)" />
        <circle cx="183" cy="31" r="4" fill="var(--color-accent)" />
        <path d="M48 42h12m-6-6v12M189 100h10m-5-5v10" stroke="var(--color-accent-light)" stroke-width="2" stroke-linecap="round" />
        <rect x="54" y="112" width="132" height="9" rx="4.5" fill="var(--color-border)" />
        <rect x="65" y="55" width="25" height="57" rx="4" fill="var(--color-primary)" />
        <path d="M72 66h11M72 101h11" stroke="var(--color-text)" stroke-width="2" stroke-linecap="round" />
        <rect x="94" y="41" width="29" height="71" rx="4" fill="var(--color-accent)" />
        <path d="M102 52h13M102 58h13M102 101h13" stroke="var(--color-surface)" stroke-width="2" stroke-linecap="round" />
        <g transform="rotate(-12 143 112)">
          <rect x="133" y="59" width="27" height="53" rx="4" fill="var(--color-accent-light)" />
          <path d="M140 70h13M140 101h13" stroke="var(--color-surface)" stroke-width="2" stroke-linecap="round" />
        </g>
      </svg>
    </div>
    <h2 id="titulo-inicio">Bienvenido a <span>la biblioteca embrujada</span></h2>
    <p class="bienvenida-descripcion">
      Animate a entrar al catálogo, encontrá tu próxima lectura de terror y
      retirá tu ejemplar antes de que suene la medianoche.
    </p>
    <RouterLink class="bienvenida-enlace" :to="{ name: 'listado' }">
      Ver catálogo de libros <span aria-hidden="true">→</span>
    </RouterLink>
    <div class="bienvenida-pie" aria-hidden="true">
      <span></span> 🕯️ Tu próxima historia empieza acá 🕯️ <span></span>
    </div>
  </section>
</template>

<style scoped>
.bienvenida {
  position: relative;
  overflow: hidden;
  padding: clamp(32px, 6vw, 56px) clamp(20px, 5vw, 48px);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radio-grande);
  background: radial-gradient(ellipse at 50% 0%, var(--color-border) 0%, var(--color-surface) 65%);
  box-shadow: var(--sombra-grande);
  text-align: center;
}

.bienvenida::before {
  content: "";
  position: absolute;
  inset: 0 15% auto;
  height: 3px;
  background: linear-gradient(90deg, transparent, var(--color-accent), transparent);
}

/* --- Decoración de Halloween --- */

/* Telarañas del bloque de bienvenida (componente Telarana.vue).
   El componente solo dibuja la figura; acá le damos posición, tamaño y color. */
.telarana-hero {
  position: absolute;
  top: 0;
  width: 92px;
  height: 92px;
  color: var(--color-border-light);
  opacity: 0.6;
}

.telarana-izq {
  left: 0;
}

/* La de la derecha es la misma figura espejada horizontalmente */
.telarana-der {
  right: 0;
  transform: scaleX(-1);
}

/* El fantasma sube y baja despacio, y se desvanece un poco en el camino */
.fantasma {
  position: absolute;
  top: 18%;
  right: 12%;
  font-size: 2rem;
  opacity: 0.85;
  pointer-events: none;
  animation: flotar 4s ease-in-out infinite;
}

@keyframes flotar {
  0%, 100% { transform: translateY(0); opacity: 0.85; }
  50%      { transform: translateY(-14px); opacity: 0.45; }
}

@media (max-width: 600px) {
  .telarana-hero {
    width: 64px;
    height: 64px;
  }

  /* En pantallas chicas el fantasma tapaba la ilustración */
  .fantasma {
    font-size: 1.5rem;
    top: 10%;
    right: 6%;
  }
}

.bienvenida-ilustracion {
  width: 200px;
  max-width: 100%;
  margin: 0 auto 20px;
}

.bienvenida-ilustracion svg {
  display: block;
  width: 100%;
  height: auto;
}

.bienvenida h2 {
  margin: 0;
  color: var(--color-text);
  font-size: clamp(1.9rem, 5vw, 3rem);
  font-weight: 750;
  line-height: 1.15;
  letter-spacing: -0.035em;
  text-wrap: balance;
}

.bienvenida h2 span {
  color: var(--color-accent);
}

.bienvenida-descripcion {
  max-width: 490px;
  margin: 20px auto 28px;
  color: var(--color-text-muted);
  font-size: 1.05rem;
  line-height: 1.75;
  text-wrap: pretty;
}

.bienvenida-enlace {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  min-height: 48px;
  padding: 12px 22px;
  border: 1px solid var(--color-accent-light);
  border-radius: var(--radio);
  background-color: var(--color-primary);
  color: #ffffff;
  font-weight: 650;
  text-decoration: none;
  box-shadow: var(--sombra-chica);
  transition: background-color var(--transicion), transform var(--transicion),
              box-shadow var(--transicion);
}

.bienvenida-enlace:hover {
  background-color: var(--color-primary-hover);
  color: #ffffff;
  transform: translateY(-2px);
  box-shadow: var(--sombra);
}

.bienvenida-enlace span {
  font-size: 1.3rem;
  line-height: 1;
}

.bienvenida-pie {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 36px;
  color: var(--color-text-muted);
  font-size: 0.8rem;
}

.bienvenida-pie span {
  width: 32px;
  height: 1px;
  background-color: var(--color-border-light);
}

@media (max-width: 480px) {
  .bienvenida-ilustracion {
    width: 160px;
  }

  .bienvenida-enlace {
    width: 100%;
  }

  .bienvenida-pie {
    gap: 8px;
    font-size: 0.75rem;
  }

  .bienvenida-pie span {
    width: 16px;
  }
}

/* El bloque de prefers-reduced-motion que estaba acá se movió a style.css,
   donde ahora anula las animaciones de toda la app de una sola vez. */
</style>

<template>
  <section class="bienvenida" aria-labelledby="titulo-inicio">
    <div class="bienvenida-ilustracion" aria-hidden="true">
      <svg viewBox="0 0 240 150" fill="none">
        <circle cx="120" cy="75" r="68" fill="#242936" />
        <circle cx="183" cy="31" r="4" fill="#88c0d0" />
        <path d="M48 42h12m-6-6v12M189 100h10m-5-5v10" stroke="#81a1c1" stroke-width="2" stroke-linecap="round" />
        <rect x="54" y="112" width="132" height="9" rx="4.5" fill="#3b4252" />
        <rect x="65" y="55" width="25" height="57" rx="4" fill="#5e81ac" />
        <path d="M72 66h11M72 101h11" stroke="#eceff4" stroke-width="2" stroke-linecap="round" />
        <rect x="94" y="41" width="29" height="71" rx="4" fill="#88c0d0" />
        <path d="M102 52h13M102 58h13M102 101h13" stroke="#242936" stroke-width="2" stroke-linecap="round" />
        <g transform="rotate(-12 143 112)">
          <rect x="133" y="59" width="27" height="53" rx="4" fill="#81a1c1" />
          <path d="M140 70h13M140 101h13" stroke="#242936" stroke-width="2" stroke-linecap="round" />
        </g>
      </svg>
    </div>
    <h2 id="titulo-inicio">Bienvenido a <span>la biblioteca</span></h2>
    <p class="bienvenida-descripcion">
      Explorá el catálogo, encontrá tu próxima lectura y solicitá un ejemplar en tu sucursal.
    </p>
    <RouterLink class="bienvenida-enlace" :to="{ name: 'listado' }">
      Ver catálogo de libros <span aria-hidden="true">→</span>
    </RouterLink>
    <div class="bienvenida-pie" aria-hidden="true">
      <span></span> Tu próxima historia empieza acá <span></span>
    </div>
  </section>
</template>

<style scoped>
.bienvenida {
  position: relative;
  overflow: hidden;
  padding: clamp(32px, 6vw, 56px) clamp(20px, 5vw, 48px);
  border: 1px solid #4c566a;
  border-radius: 20px;
  background: radial-gradient(ellipse at 50% 0%, #3b4252 0%, #242936 65%);
  box-shadow: 0 16px 40px #1a1d2466;
  text-align: center;
}

.bienvenida::before {
  content: "";
  position: absolute;
  inset: 0 15% auto;
  height: 3px;
  background: linear-gradient(90deg, transparent, #88c0d0, transparent);
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
  color: #eceff4;
  font-size: clamp(1.9rem, 5vw, 3rem);
  font-weight: 750;
  line-height: 1.15;
  letter-spacing: -0.035em;
  text-wrap: balance;
}

.bienvenida h2 span {
  color: #88c0d0;
}

.bienvenida-descripcion {
  max-width: 490px;
  margin: 20px auto 28px;
  color: #d8dee9;
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
  border: 1px solid #81a1c1;
  border-radius: 10px;
  background-color: #5e81ac;
  color: #ffffff;
  font-weight: 650;
  text-decoration: none;
  box-shadow: 0 6px 18px #1a1d2466;
  transition: background-color 180ms ease, transform 180ms ease, box-shadow 180ms ease;
}

.bienvenida-enlace:hover {
  background-color: #81a1c1;
  color: #1a1d24;
  transform: translateY(-2px);
  box-shadow: 0 10px 22px #1a1d2466;
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
  color: #d8dee9;
  font-size: 0.8rem;
}

.bienvenida-pie span {
  width: 32px;
  height: 1px;
  background-color: #4c566a;
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

@media (prefers-reduced-motion: reduce) {
  .bienvenida-enlace {
    transition: none;
  }

  .bienvenida-enlace:hover {
    transform: none;
  }
}
</style>

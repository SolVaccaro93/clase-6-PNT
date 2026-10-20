<template>
  <section class="bienvenida" aria-labelledby="titulo-inicio">
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
  transition: background-color 180ms ease, transform 180ms ease, box-shadow 180ms ease;
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

@media (prefers-reduced-motion: reduce) {
  .bienvenida-enlace {
    transition: none;
  }

  .bienvenida-enlace:hover {
    transform: none;
  }
}
</style>

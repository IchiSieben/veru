import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // Cambiar al dominio real cuando se despliegue (necesario para sitemap/OG absolutos).
  site: 'https://veru.pe',
  image: {
    // Permitir optimizar también las URLs remotas de Unsplash si se usan.
    domains: ['images.unsplash.com'],
  },
  // El sitemap (@astrojs/sitemap) se integra en la Fase 3 (SEO), junto con meta/OG/JSON-LD.
});

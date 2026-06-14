import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // Cambiar al dominio real cuando se despliegue (necesario para sitemap/OG absolutos).
  site: 'https://veru.pe',
  integrations: [
    sitemap({
      // Excluir páginas no indexables del sitemap.
      filter: (page) =>
        !page.includes('/checkout') && !page.includes('/pedido-confirmado'),
    }),
  ],
  image: {
    // Permitir optimizar también las URLs remotas de Unsplash si se usan.
    domains: ['images.unsplash.com'],
  },
});

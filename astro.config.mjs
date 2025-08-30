import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import node from '@astrojs/node';

import icon from 'astro-icon';

// https://astro.build/config
export default defineConfig({
	output: 'server',
	adapter: node({
		mode: 'standalone'
	}),
	vite: {
    plugins: [tailwindcss()]
  },

  integrations: [icon(), react()],
});
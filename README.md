# 🚀 Astro Starter Kit – Guide Complet

Ce projet est un starter kit Astro prêt à l’emploi, incluant :
- 🎨 [Tailwind CSS](https://tailwindcss.com/)
- 🔤 [astro-font](https://github.com/natemoo-re/astro-font) pour les polices locales
- 🖼️ [astro-icon](https://github.com/natemoo-re/astro-icon) pour les icônes
- 🧩 [Starwind UI](https://starwind-ui.com/) pour des composants UI modernes

---

## 1. Création du projet

```sh
npm create astro@latest
```

---

## 2. Ajout de Tailwind CSS

```sh
npx astro add tailwind
```

> ℹ️ **Notice**  
> N’oublie pas d’importer le CSS global dans ton layout principal :

```astro
---
import './src/styles/global.css';
---
```

---

## 3. Ajout et configuration de astro-font

Installe le plugin :

```sh
npm install astro-font
```

Ajoute la configuration suivante dans ton layout (ex : `src/layouts/Layout.astro`) :

```astro
import { AstroFont } from "astro-font";

<AstroFont
  config={[
    {
      name: "Bowlby One SC",
      src: [
        {
          style: "normal",
          weight: "400",
          path: "./public/fonts/Bowlby_One_SC/BowlbyOneSC-Regular.ttf"
        }
      ],
      preload: true,
      display: "swap",
      selector: "h1, h2, h3, h4, h5, h6",
      fallback: "sans-serif"
    },
    {
      name: "Palanquin",
      src: [
        {
          style: "normal",
          weight: "400",
          path: "./public/fonts/Palanquin/Palanquin-Regular.ttf"
        },
        {
          style: "normal",
          weight: "500",
          path: "./public/fonts/Palanquin/Palanquin-Medium.ttf"
        },
        {
          style: "normal",
          weight: "600",
          path: "./public/fonts/Palanquin/Palanquin-SemiBold.ttf"
        },
        {
          style: "normal",
          weight: "700",
          path: "./public/fonts/Palanquin/Palanquin-Bold.ttf"
        },
        {
          style: "normal",
          weight: "200",
          path: "./public/fonts/Palanquin/Palanquin-ExtraLight.ttf"
        },
        {
          style: "normal",
          weight: "300",
          path: "./public/fonts/Palanquin/Palanquin-Light.ttf"
        },
        {
          style: "normal",
          weight: "100",
          path: "./public/fonts/Palanquin/Palanquin-Thin.ttf"
        }
      ],
      preload: false,
      display: "swap",
      selector: "body",
      fallback: "sans-serif"
    }
  ]}
/>
```

- 📁 **Attention**  
  Place bien tes fichiers de polices dans `public/fonts/` selon la structure indiquée.

---

## 4. Ajout et utilisation d’icônes avec astro-icon

Ajoute le plugin :

```sh
npx astro add astro-icon
```

Installe le pack d’icônes Material Design :

```sh
npm install @iconify-json/mdi
```

Utilisation dans un composant Astro :

```astro
import { Icon } from 'astro-icon/components';

<Icon name="mdi:rocket-launch" class="text-4xl text-blue-500" />
```

> 💡 **Aller plus loin**  
> Consulte la [doc astro-icon](https://github.com/natemoo-re/astro-icon) pour découvrir comment utiliser d’autres packs d’icônes ou personnaliser leur apparence.

---

## 5. Ajout de Starwind UI et de tous ses composants

Installe Starwind UI et ajoute tous les composants disponibles :

```sh
npx starwind@latest init
npx starwind@latest add Accordion Alert Avatar Badge Breadcrumb Button Card Checkbox Dialog Dropdown Input Label Pagination Select Switch Table Tabs Textarea Tooltip
```

> ⚠️ **Attention**  
> Certains composants peuvent nécessiter des dépendances ou une configuration supplémentaire. Consulte la [documentation Starwind](https://starwind-ui.com/docs/components) pour plus de détails.

---

## 6. Dépendances additionnelles utiles

Installe les dépendances complémentaires pour enrichir ton projet :

```sh
npm install @tabler/icons @tailwindcss/forms tailwind-variants tw-animate-css
```

---

## 7. Lancer le projet

```sh
npm run dev
```

> ⚡ **Astuce**  
> Utilise `npm run build` pour générer le site en production.

---

## 8. Structure recommandée

- `src/layouts/` : Layouts globaux
- `src/components/` : Composants réutilisables
- `src/pages/` : Pages du site
- `src/styles/` : Fichiers CSS globaux
- `public/fonts/` : Polices locales

---

## 9. Fichiers de configuration

### `package.json`

```json
{
  "name": "project",
  "type": "module",
  "version": "0.0.1",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "astro": "astro"
  },
  "dependencies": {
    "@iconify-json/mdi": "^1.2.3",
    "@tabler/icons": "^3.34.0",
    "@tailwindcss/forms": "^0.5.10",
    "@tailwindcss/vite": "^4.1.10",
    "astro": "^5.10.1",
    "astro-font": "^1.1.0",
    "astro-icon": "^1.1.5",
    "tailwind-variants": "^1.0.0",
    "tailwindcss": "^4.1.10",
    "tw-animate-css": "^1.3.4"
  }
}
```

---

### `astro.config.mjs`

```js
// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import icon from 'astro-icon';

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()]
  },
  integrations: [icon()]
});
```

---

## 10. Ressources utiles

- 📚 [Documentation Astro](https://docs.astro.build/)
- 🔤 [Astro Font](https://github.com/natemoo-re/astro-font)
- 🖼️ [Astro Icon](https://github.com/natemoo-re/astro-icon)
- 🎨 [Tailwind CSS](https://tailwindcss.com/)
- 🧩 [Starwind UI](https://starwind-ui.com/)

---

✨ Ce starter kit est prêt pour démarrer rapidement un projet Astro moderne, accessible et performant.  
N’hésite pas à l’adapter à tes besoins et à explorer la documentation pour approfondir tes connaissances.
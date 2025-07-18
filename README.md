## Prettier IDE config
```text
{**/*,*}.{js,ts,jsx,tsx,vue,astro,html,tpl,svg,css,scss}
```

## File Structure
```text
modx-vite-boilerplate/
├── common/
│   ├── css/
│   │   └── base.css
│   └── js/
│       └── base.js
├── components/
│   ├── favicon/
│   │   └── favicon.tpl
│   ├── footer/
│   │   └── footer.tpl
│   └── header/
│       └── header.tpl
├── layouts/
│   └── default.tpl
├── pages/
│   └── index/
│       ├── index.js
│       └── index.tpl
├── root/
│   ├── assets/
│   │   ├── resources/
│   │   │   └── 1/
│   │   └── template/
│   │       ├── favicon/
│   │       │   └── favicon.svg
│   │       ├── fonts/
│   │       └── img/
│   │           └── icons/
│   ├── core/
│   │   └── elements/
│   │       ├── plugins/
│   │       └── snippets/
│   │           ├── get_base_url.php
│   │           └── vite.php
│   └── .htaccess
├── vite/
├── .gitignore
├── .prettierrc
├── index.html
├── package.json
└── vite.config.js
```

## SCSS Version
A version without Tailwind CSS, with a classic SCSS setup, is available in the [scss-version](https://github.com/furashcka/modx-vite-boilerplate/tree/scss-version) branch.
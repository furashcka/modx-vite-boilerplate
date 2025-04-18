## Prettier IDE config
```text
{**/*,*}.{js,ts,jsx,tsx,vue,astro,html,tpl,svg,css,scss}
```

## File Structure
```text
modx-vite-boilerplate/
├── common/
│   ├── js/
│   │   └── base.js
│   └── scss/
│       └── _base.scss
├── components/
│   ├── favicon/
│   │   ├── favicon.svg
│   │   └── favicon.tpl
│   ├── footer/
│   │   ├── footer.scss
│   │   └── footer.tpl
│   └── header/
│       ├── header.scss
│       └── header.tpl
├── layouts/
│   └── default.tpl
├── pages/
│   └── index/
│       ├── index.js
│       ├── index.scss
│       └── index.tpl
├── root/
│   ├── assets/
│   │   ├── resources/
│   │   │   └── 1/
│   │   └── template/
│   │       ├── fonts/
│   │       └── img/
│   ├── core/
│   │   └── elements/
│   │       ├── plugins/
│   │       └── snippets/
│   │           └── vite.php
│   └── .htaccess
├── vite/
├── .gitignore
├── .prettierrc
├── index.html
├── package.json
└── vite.config.js
```
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
│   │   ├── favicon.svg
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
│   │       ├── fonts/
│   │       └── img/
│   ├── core/
│   │   └── elements/
│   │       ├── plugins/
│   │       └── snippets/
│   │           ├── get_base_url.php
│   │           ├── init_placeholders.php
│   │           └── vite.php
│   └── .htaccess
├── vite/
├── .gitignore
├── .prettierrc
├── index.html
├── package.json
└── vite.config.js
```
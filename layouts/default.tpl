<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <title>{$_modx->resource.seo_title ? $_modx->resource.seo_title : $_modx->resource.pagetitle}</title>
    <meta
      name="description"
      content="{$_modx->resource.seo_description ? $_modx->resource.seo_description : ''}"
    />
    <link
      rel="canonical"
      href="{$_modx->resource.seo_canonical ? $_modx->resource.seo_canonical : $modx->makeUrl($_modx->resource.id, '', '', 'full')}"
    />

    <base href="{$_modx->runSnippet('@FILE snippets/get_base_url.php')}" />

    {include "file:components/favicon/favicon.tpl"}

    {$_modx->runSnippet("@FILE snippets/vite.php", ["common/css/base.css"])}
    {block 'styles'}{/block}
  </head>

  <body>
    {include "file:components/header/header.tpl"}
    {block 'page'}{/block}
    {include "file:components/footer/footer.tpl"}
    {block 'scripts'}{/block}
  </body>
</html>

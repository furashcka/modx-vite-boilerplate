{$_modx->runSnippet("!@FILE snippets/init_placeholders.php")}
<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no, minimal-ui" />

    <base href="{$_modx->runSnippet('@FILE snippets/get_base_url.php')}" />
    <link rel="canonical" href="{$_modx->getPlaceholder('canonical')}" />

    {include "file:components/favicon/favicon.tpl"}

    <title>{$_modx->getPlaceholder("seoTitle")}</title>
    <meta
      name="description"
      content="{$_modx->getPlaceholder('seoDescription')}" />

    {block 'styles'}{/block}
  </head>

  <body>
    <!-- prettier-ignore -->
    {include "file:components/header/header.tpl"}
    {block 'page'}{/block}
    {include "file:components/footer/footer.tpl"}
    {block 'scripts'}{/block}
  </body>
</html>

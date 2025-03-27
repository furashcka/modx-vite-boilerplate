<!-- prettier-ignore -->
{extends "file:layouts/default.tpl"}

{block "styles"}
  {$_modx->runSnippet("@FILE snippets/vite.php", ["pages/index/index.scss"])}
{/block}

{block "scripts"}
  {$_modx->runSnippet("@FILE snippets/vite.php", ["pages/index/index.js"])}
{/block}

{block "page"}
<div class="container">
  <section>
    <!-- prettier-ignore -->
    <h1>{$_modx->resource.longtitle ? $_modx->resource.longtitle : $_modx->resource.pagetitle}</h1>
    {$_modx->resource.content}
  </section>
</div>
{/block}

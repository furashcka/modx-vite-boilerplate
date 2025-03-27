<?php
$isMobile = preg_match("/(android|avantgo|blackberry|bolt|boost|cricket|docomo|fone|hiptop|mini|mobi|palm|phone|pie|tablet|up\.browser|up\.link|webos|wos)/i", $_SERVER["HTTP_USER_AGENT"]);
$modx->setPlaceholder("isMobile", (int) $isMobile);

$resource_id = $modx->resource->get('id');

// SEO
if ($resource_id > 0) {
  $title = $modx->resource->get('pagetitle');
  $seoTitle = $modx->resource->getTVValue('seo_title');
  $seoDescription = $modx->resource->getTVValue('seo_description');
  $canonical = $canonical ? $canonical : $modx->makeUrl($resource_id,'','', 'full');

  $modx->setPlaceholder("canonical", $canonical);
  $modx->setPlaceholder("seoTitle", $seoTitle ? $seoTitle : $title);
  $modx->setPlaceholder("seoDescription", htmlspecialchars($seoDescription));
} else {
    $modx->setPlaceholder("seoTitle", "");
    $modx->setPlaceholder("seoDescription", "");
}

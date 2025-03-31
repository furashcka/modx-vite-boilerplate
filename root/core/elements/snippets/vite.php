<?php
$src = $scriptProperties[0] ?? '';
if (empty($src)) return '';

// Initialized using vite
$is_dev = false;

// Production mode - work with manifest.json
if (!$is_dev) {
    // Cache manifest for 1 hour (3600 seconds)
    $manifest = $modx->cacheManager->get('vite_manifest');

    if (empty($manifest)) {
        $manifestPath = MODX_BASE_PATH . 'assets/template/manifest.json';
        if (!file_exists($manifestPath)) return '';

        $manifestContent = file_get_contents($manifestPath);
        $manifest = json_decode($manifestContent, true);
        if (json_last_error() !== JSON_ERROR_NONE) return '';

        $modx->cacheManager->set('vite_manifest', $manifest, 3600);
    }

    // Find requested file in manifest
    if (!isset($manifest[$src])) return '';

    $entry = $manifest[$src];

    // For JS
    if (str_ends_with($src, '.js')) {
        $output = '<script src="/' . $entry['file'] . '"></script>';

        return $output;
    }
    // For SCSS/CSS
    elseif (str_ends_with($src, '.scss') || str_ends_with($src, '.css')) {
        if (isset($entry['isEntry']) && $entry['isEntry']) {
            return '<link rel="stylesheet" href="/' . $entry['file'] . '" />';
        }
    }

    return '';
}
// Dev mode
else {
  if (!str_ends_with($src, '.js')) return '';

  $host = "http://localhost:5173";
  return '<script type="module" src="' . $host . '/' . $src . '"></script>';
}

return '';

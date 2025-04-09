<?php
$proto = isset($_SERVER['HTTP_X_FORWARDED_PROTO'])
  ? $_SERVER['HTTP_X_FORWARDED_PROTO']
  : (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http');

$host = isset($_SERVER['HTTP_X_FORWARDED_HOST'])
  ? $_SERVER['HTTP_X_FORWARDED_HOST']
  : (isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : '');

return $proto . '://' . $host . "/";
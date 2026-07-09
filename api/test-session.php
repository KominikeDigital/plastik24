<?php
declare(strict_types=1);

require __DIR__ . '/common.php';

header('Content-Type: application/json');
echo json_encode([
    'session_name' => session_name(),
    'session_id' => session_id(),
    'session_data' => $_SESSION,
    'cookie' => $_COOKIE,
]);

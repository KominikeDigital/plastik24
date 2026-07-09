<?php
declare(strict_types=1);
require __DIR__ . '/common.php';

header('Content-Type: application/json; charset=utf-8');

echo json_encode([
    'sessionId'       => session_id(),
    'sessionName'     => session_name(),
    'memberId'        => $_SESSION['plastik24_member_id'] ?? null,
    'memberEmail'     => $_SESSION['plastik24_member_email'] ?? null,
    'adminAuth'       => $_SESSION['raceplast_admin_auth'] ?? null,
    'cookieParams'    => session_get_cookie_params(),
    'phpVersion'      => PHP_VERSION,
    'time'            => gmdate('c'),
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

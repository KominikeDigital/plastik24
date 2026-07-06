<?php
declare(strict_types=1);

require __DIR__ . '/common.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    rp_json_response(['ok' => false, 'message' => 'Sadece POST desteklenir.'], 405);
}

$payload = rp_request_json();
$username = trim((string)($payload['username'] ?? ''));
$password = (string)($payload['password'] ?? '');
$admin = rp_get_admin();

if ($username === (string)$admin['username'] && password_verify($password, (string)$admin['passwordHash'])) {
    session_regenerate_id(true);
    $_SESSION['raceplast_admin_auth'] = true;
    $_SESSION['raceplast_admin_user'] = $username;
    session_write_close();
    rp_json_response(['ok' => true, 'username' => $username]);
}

rp_json_response(['ok' => false, 'message' => 'Kullanıcı adı veya şifre hatalı.'], 401);

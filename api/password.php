<?php
declare(strict_types=1);

require __DIR__ . '/common.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    rp_json_response(['ok' => false, 'message' => 'Sadece POST desteklenir.'], 405);
}

rp_require_auth();

$payload = rp_request_json();
$currentPassword = (string)($payload['currentPassword'] ?? '');
$newPassword = (string)($payload['newPassword'] ?? '');
$newUsername = trim((string)($payload['username'] ?? 'admin'));
$admin = rp_get_admin();

if (!password_verify($currentPassword, (string)$admin['passwordHash'])) {
    rp_json_response(['ok' => false, 'message' => 'Mevcut şifre hatalı.'], 422);
}

if (strlen($newPassword) < 8) {
    rp_json_response(['ok' => false, 'message' => 'Yeni şifre en az 8 karakter olmalıdır.'], 422);
}

$next = [
    'username' => $newUsername !== '' ? $newUsername : 'admin',
    'passwordHash' => password_hash($newPassword, PASSWORD_DEFAULT),
    'updatedAt' => gmdate('c'),
];

rp_write_json(RACEPLAST_ADMIN_FILE, $next);
$_SESSION['raceplast_admin_user'] = $next['username'];

rp_json_response(['ok' => true, 'message' => 'Şifre güncellendi.', 'username' => $next['username']]);

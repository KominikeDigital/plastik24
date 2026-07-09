<?php
declare(strict_types=1);

require __DIR__ . '/common.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    rp_json_response(['ok' => false, 'message' => 'Sadece POST desteklenir.'], 405);
}

$payload = rp_request_json();
$email = strtolower(trim((string)($payload['email'] ?? '')));
$password = (string)($payload['password'] ?? '');

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    rp_json_response(['ok' => false, 'message' => 'Geçerli bir e-posta adresi girin.'], 422);
}

if (strlen($password) < 8) {
    rp_json_response(['ok' => false, 'message' => 'Şifre en az 8 karakter olmalıdır.'], 422);
}

$members = rp_read_json(RACEPLAST_MEMBERS_FILE, []);
$member = null;
foreach ($members as $candidate) {
    if (!is_array($candidate)) {
        continue;
    }
    if (strtolower(trim((string)($candidate['authorizedEmail'] ?? ''))) === $email) {
        $member = $candidate;
        break;
    }
}

if (!$member || empty($member['passwordHash']) || !password_verify($password, (string)$member['passwordHash'])) {
    rp_json_response(['ok' => false, 'message' => 'E-posta veya şifre hatalı.'], 401);
}

$status = (string)($member['status'] ?? 'pending');
if ($status !== 'approved') {
    rp_json_response(['ok' => false, 'message' => 'Üyeliğiniz henüz onaylanmamış. Onay sonrası giriş yapabilirsiniz.'], 403);
}

if (session_status() === PHP_SESSION_ACTIVE && !headers_sent()) {
    session_regenerate_id(true);
}
$_SESSION['plastik24_member_id'] = (string)($member['id'] ?? '');
$_SESSION['plastik24_member_email'] = $email;
session_write_close();

rp_json_response([
    'ok' => true,
    'message' => 'Üye girişi başarılı.',
    'panelRedirect' => true,
    'member' => [
        'id' => (string)($member['id'] ?? ''),
        'companyName' => (string)($member['companyName'] ?? ''),
        'authorizedName' => (string)($member['authorizedName'] ?? ''),
        'authorizedEmail' => (string)($member['authorizedEmail'] ?? ''),
        'status' => $status,
    ],
]);

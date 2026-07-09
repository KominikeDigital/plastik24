<?php
declare(strict_types=1);

require __DIR__ . '/common.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    rp_json_response(['ok' => false, 'message' => 'Sadece POST desteklenir.'], 405);
}

$memberId = (string)($_SESSION['plastik24_member_id'] ?? '');
if ($memberId === '') {
    rp_json_response(['ok' => false, 'message' => 'Oturum bulunamadı.'], 401);
}

$payload = rp_request_json();

$members = rp_read_json(RACEPLAST_MEMBERS_FILE, []);
$index = -1;
foreach ($members as $i => $candidate) {
    if (!is_array($candidate)) continue;
    if ((string)($candidate['id'] ?? '') === $memberId) {
        $index = $i;
        break;
    }
}

if ($index < 0) {
    rp_json_response(['ok' => false, 'message' => 'Üye bulunamadı.'], 404);
}

$member = $members[$index];
$now = gmdate('c');

// Güncellenebilir alanlar (kritik alanlar güncellenmez: id, status, taxNo, authorizedEmail)
$allowedFields = ['authorizedName', 'authorizedPhone', 'address', 'taxOffice', 'companyName'];
foreach ($allowedFields as $field) {
    if (isset($payload[$field])) {
        $member[$field] = trim((string)$payload[$field]);
    }
}

// Şifre değiştirme isteği
if (!empty($payload['currentPassword']) && !empty($payload['newPassword'])) {
    $current = (string)$payload['currentPassword'];
    $new = (string)$payload['newPassword'];
    if (strlen($new) < 8) {
        rp_json_response(['ok' => false, 'message' => 'Yeni şifre en az 8 karakter olmalıdır.'], 422);
    }
    if (!password_verify($current, (string)($member['passwordHash'] ?? ''))) {
        rp_json_response(['ok' => false, 'message' => 'Mevcut şifre hatalı.'], 401);
    }
    $member['passwordHash'] = password_hash($new, PASSWORD_DEFAULT);
}

$member['updatedAt'] = $now;
$members[$index] = $member;
rp_write_json(RACEPLAST_MEMBERS_FILE, $members);

rp_json_response([
    'ok' => true,
    'message' => 'Bilgileriniz güncellendi.',
    'member' => [
        'id'              => (string)($member['id'] ?? ''),
        'companyName'     => (string)($member['companyName'] ?? ''),
        'authorizedName'  => (string)($member['authorizedName'] ?? ''),
        'authorizedEmail' => (string)($member['authorizedEmail'] ?? ''),
        'authorizedPhone' => (string)($member['authorizedPhone'] ?? ''),
        'address'         => (string)($member['address'] ?? ''),
        'taxNo'           => (string)($member['taxNo'] ?? ''),
        'taxOffice'       => (string)($member['taxOffice'] ?? ''),
    ],
]);

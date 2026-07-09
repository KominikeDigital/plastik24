<?php
declare(strict_types=1);

require __DIR__ . '/common.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    rp_json_response(['ok' => false, 'message' => 'Sadece POST desteklenir.'], 405);
}

$payload = rp_request_json();
$email    = strtolower(trim((string)($payload['email'] ?? '')));
$password = (string)($payload['password'] ?? '');

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    rp_json_response(['ok' => false, 'message' => 'Geçerli bir e-posta adresi girin.'], 422);
}

if (strlen($password) < 6) {
    rp_json_response(['ok' => false, 'message' => 'Şifre en az 6 karakter olmalıdır.'], 422);
}

$members     = rp_read_json(RACEPLAST_MEMBERS_FILE, []);
$member      = null;
$memberIndex = -1;
foreach ($members as $idx => $candidate) {
    if (!is_array($candidate)) {
        continue;
    }
    if (strtolower(trim((string)($candidate['authorizedEmail'] ?? ''))) === $email) {
        $member      = $candidate;
        $memberIndex = $idx;
        break;
    }
}

if (!$member || empty($member['passwordHash']) || !password_verify($password, (string)$member['passwordHash'])) {
    rp_json_response(['ok' => false, 'message' => 'E-posta veya şifre hatalı.'], 401);
}

// Otomatik onayla
$status = (string)($member['status'] ?? 'pending');
if ($status !== 'approved') {
    $status = 'approved';
    if ($memberIndex >= 0) {
        $members[$memberIndex]['status'] = 'approved';
        rp_write_json(RACEPLAST_MEMBERS_FILE, $members);
    }
}

// Oturum yönetimi - güvenli yenileme
$_SESSION['plastik24_member_id']    = (string)($member['id'] ?? '');
$_SESSION['plastik24_member_email'] = $email;
// Admin oturumunu etkilememek için sadece üye değişkenlerini set ediyoruz

rp_json_response([
    'ok'           => true,
    'message'      => 'Üye girişi başarılı.',
    'panelRedirect' => true,
    'member'       => [
        'id'             => (string)($member['id'] ?? ''),
        'companyName'    => (string)($member['companyName'] ?? ''),
        'authorizedName' => (string)($member['authorizedName'] ?? ''),
        'authorizedEmail' => (string)($member['authorizedEmail'] ?? ''),
        'authorizedPhone' => (string)($member['authorizedPhone'] ?? ''),
        'address'        => (string)($member['address'] ?? ''),
        'taxNo'          => (string)($member['taxNo'] ?? ''),
        'taxOffice'      => (string)($member['taxOffice'] ?? ''),
        'status'         => $status,
    ],
]);

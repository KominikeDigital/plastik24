<?php
declare(strict_types=1);

require __DIR__ . '/common.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    rp_json_response(['ok' => false, 'message' => 'Sadece GET desteklenir.'], 405);
}

$memberId = (string)($_SESSION['plastik24_member_id'] ?? '');
if ($memberId === '') {
    rp_json_response(['ok' => false, 'loggedIn' => false, 'message' => 'Oturum bulunamadı.'], 401);
}

$members = rp_read_json(RACEPLAST_MEMBERS_FILE, []);
$member = null;
foreach ($members as $candidate) {
    if (!is_array($candidate)) continue;
    if ((string)($candidate['id'] ?? '') === $memberId) {
        $member = $candidate;
        break;
    }
}

if (!$member) {
    session_destroy();
    rp_json_response(['ok' => false, 'loggedIn' => false, 'message' => 'Üye bulunamadı.'], 401);
}

if ((string)($member['status'] ?? 'pending') !== 'approved') {
    rp_json_response(['ok' => false, 'loggedIn' => false, 'message' => 'Üyelik onay bekliyor.'], 403);
}

rp_json_response([
    'ok' => true,
    'loggedIn' => true,
    'member' => [
        'id'               => (string)($member['id'] ?? ''),
        'companyName'      => (string)($member['companyName'] ?? ''),
        'authorizedName'   => (string)($member['authorizedName'] ?? ''),
        'authorizedEmail'  => (string)($member['authorizedEmail'] ?? ''),
        'authorizedPhone'  => (string)($member['authorizedPhone'] ?? ''),
        'address'          => (string)($member['address'] ?? ''),
        'taxNo'            => (string)($member['taxNo'] ?? ''),
        'taxOffice'        => (string)($member['taxOffice'] ?? ''),
        'status'           => (string)($member['status'] ?? ''),
        'createdAt'        => (string)($member['createdAt'] ?? ''),
    ],
]);

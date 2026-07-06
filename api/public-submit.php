<?php
declare(strict_types=1);

require __DIR__ . '/common.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    rp_json_response(['ok' => false, 'message' => 'Sadece POST desteklenir.'], 405);
}

function rp_required_string(array $payload, string $key, string $label): string
{
    $value = trim((string)($payload[$key] ?? ''));
    if ($value === '') {
        rp_json_response(['ok' => false, 'message' => "{$label} zorunludur."], 422);
    }
    return $value;
}

function rp_valid_email(string $email): string
{
    $email = trim($email);
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        rp_json_response(['ok' => false, 'message' => 'Geçerli bir e-posta adresi girin.'], 422);
    }
    return strtolower($email);
}

function rp_find_by_email(array $items, string $field, string $email): int
{
    foreach ($items as $index => $item) {
        if (strtolower(trim((string)($item[$field] ?? ''))) === $email) {
            return $index;
        }
    }
    return -1;
}

$payload = rp_request_json();
$type = (string)($payload['type'] ?? '');
$now = gmdate('c');

if ($type === 'newsletter') {
    $email = rp_valid_email(rp_required_string($payload, 'email', 'E-posta'));
    $subscribers = rp_read_json(RACEPLAST_NEWSLETTER_FILE, []);
    $index = rp_find_by_email($subscribers, 'email', $email);
    $record = [
        'id' => $index >= 0 ? ($subscribers[$index]['id'] ?? ('newsletter-' . time())) : ('newsletter-' . time() . '-' . bin2hex(random_bytes(3))),
        'email' => $email,
        'status' => 'active',
        'source' => (string)($payload['source'] ?? 'website'),
        'createdAt' => $index >= 0 ? ($subscribers[$index]['createdAt'] ?? $now) : $now,
        'updatedAt' => $now,
        'notes' => $index >= 0 ? ($subscribers[$index]['notes'] ?? '') : '',
    ];

    if ($index >= 0) {
        $subscribers[$index] = array_merge($subscribers[$index], $record);
    } else {
        $subscribers[] = $record;
    }

    rp_write_json(RACEPLAST_NEWSLETTER_FILE, $subscribers);
    rp_json_response(['ok' => true, 'message' => 'Bülten aboneliğiniz alınmıştır.']);
}

if ($type === 'membership') {
    $companyName = rp_required_string($payload, 'companyName', 'Firma adı');
    $address = rp_required_string($payload, 'address', 'Firma adresi');
    $taxNo = preg_replace('/\D+/', '', rp_required_string($payload, 'taxNo', 'Vergi no')) ?: '';
    $taxOffice = rp_required_string($payload, 'taxOffice', 'Vergi dairesi');
    $authorizedName = rp_required_string($payload, 'authorizedName', 'Yetkili adı');
    $authorizedPhone = preg_replace('/\D+/', '', rp_required_string($payload, 'authorizedPhone', 'Yetkili telefonu')) ?: '';
    $authorizedEmail = rp_valid_email(rp_required_string($payload, 'authorizedEmail', 'Yetkili e-postası'));

    if ($taxNo === '' || $authorizedPhone === '') {
        rp_json_response(['ok' => false, 'message' => 'Vergi no ve telefon sadece rakamlardan oluşmalıdır.'], 422);
    }

    $members = rp_read_json(RACEPLAST_MEMBERS_FILE, []);
    $index = rp_find_by_email($members, 'authorizedEmail', $authorizedEmail);
    $record = [
        'id' => $index >= 0 ? ($members[$index]['id'] ?? ('member-' . time())) : ('member-' . time() . '-' . bin2hex(random_bytes(3))),
        'status' => $index >= 0 ? ($members[$index]['status'] ?? 'pending') : 'pending',
        'companyName' => $companyName,
        'address' => $address,
        'taxNo' => $taxNo,
        'taxOffice' => $taxOffice,
        'authorizedName' => $authorizedName,
        'authorizedPhone' => $authorizedPhone,
        'authorizedEmail' => $authorizedEmail,
        'createdAt' => $index >= 0 ? ($members[$index]['createdAt'] ?? $now) : $now,
        'updatedAt' => $now,
        'notes' => $index >= 0 ? ($members[$index]['notes'] ?? '') : '',
        'emailVerified' => !empty($payload['emailVerified']),
        'agreement' => !empty($payload['agreement']),
    ];

    if ($index >= 0) {
        $members[$index] = array_merge($members[$index], $record);
    } else {
        $members[] = $record;
    }

    rp_write_json(RACEPLAST_MEMBERS_FILE, $members);
    rp_json_response(['ok' => true, 'message' => 'Üyelik başvurunuz alınmıştır.']);
}

rp_json_response(['ok' => false, 'message' => 'Geçersiz kayıt türü.'], 422);

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

function rp_verification_code(): string
{
    return (string)random_int(100000, 999999);
}

function rp_clean_verification_records(array $records): array
{
    $now = time();
    return array_filter($records, static function ($record) use ($now): bool {
        return is_array($record) && (int)($record['expiresAt'] ?? 0) >= $now;
    });
}

function rp_save_verification(string $email, string $code): void
{
    $records = rp_clean_verification_records(rp_read_json(RACEPLAST_VERIFICATION_FILE, []));
    $records[$email] = [
        'codeHash' => password_hash($code, PASSWORD_DEFAULT),
        'createdAt' => time(),
        'expiresAt' => time() + 20 * 60,
        'attempts' => 0,
    ];
    rp_write_json(RACEPLAST_VERIFICATION_FILE, $records);
}

function rp_check_verification(string $email, string $code, bool $consume = false): bool
{
    $records = rp_clean_verification_records(rp_read_json(RACEPLAST_VERIFICATION_FILE, []));
    $record = $records[$email] ?? null;
    if (!$record || !is_array($record)) {
        rp_write_json(RACEPLAST_VERIFICATION_FILE, $records);
        return false;
    }

    $record['attempts'] = (int)($record['attempts'] ?? 0) + 1;
    $ok = $record['attempts'] <= 6 && password_verify($code, (string)($record['codeHash'] ?? ''));
    if ($ok && $consume) {
        unset($records[$email]);
    } else {
        $records[$email] = $record;
    }
    rp_write_json(RACEPLAST_VERIFICATION_FILE, $records);
    return $ok;
}

function rp_send_admin_notification(string $subject, string $body): void
{
    $settings = rp_mail_settings();
    $email = trim((string)($settings['notificationEmail'] ?? ''));
    if ($email !== '') {
        rp_send_mail($email, $subject, $body);
    }
}

function rp_nilvera_tax_check(string $taxNo): array
{
    $settings = rp_mail_settings();
    if (empty($settings['nilveraEnabled']) || trim((string)($settings['nilveraApiKey'] ?? '')) === '') {
        return ['checked' => false, 'ok' => true];
    }

    $base = rtrim((string)($settings['nilveraApiBase'] ?? 'https://apitest.nilvera.com'), '/');
    $url = $base . '/general/GlobalCompany/Check/TaxNumber/' . rawurlencode($taxNo) . '?globalUserType=Invoice';
    $headers = [
        'Authorization: Bearer ' . trim((string)$settings['nilveraApiKey']),
        'Accept: application/json',
    ];

    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_TIMEOUT => 18,
        ]);
        $body = curl_exec($ch);
        $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);
    } else {
        $context = stream_context_create([
            'http' => [
                'method' => 'GET',
                'header' => implode("\r\n", $headers),
                'timeout' => 18,
                'ignore_errors' => true,
            ],
        ]);
        $body = @file_get_contents($url, false, $context);
        $status = 0;
        $responseHeaders = function_exists('http_get_last_response_headers')
            ? (http_get_last_response_headers() ?: [])
            : ($GLOBALS['http_response_header'] ?? []);
        if (isset($responseHeaders[0]) && preg_match('/\s(\d{3})\s/', $responseHeaders[0], $match)) {
            $status = (int)$match[1];
        }
        $error = $body === false ? 'Nilvera servisine ulaşılamadı.' : '';
    }

    if ($status === 200) {
        $decoded = json_decode((string)$body, true);
        return ['checked' => true, 'ok' => true, 'data' => is_array($decoded) ? $decoded : []];
    }
    if ($status === 404) {
        return ['checked' => true, 'ok' => false, 'message' => 'Vergi numarası Nilvera e-Fatura mükellef sorgusunda bulunamadı.'];
    }
    if ($status === 403) {
        return ['checked' => true, 'ok' => false, 'message' => 'Nilvera API anahtarı yetkili değil. Admin panelindeki mail ayarlarını kontrol edin.'];
    }
    return ['checked' => true, 'ok' => false, 'message' => $error ?: 'Nilvera vergi doğrulama servisi geçici olarak yanıt vermedi.'];
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
    rp_send_admin_notification(
        'Yeni Plastik24 bülten aboneliği',
        "Yeni bülten kaydı alındı.\n\nE-posta: {$email}\nKaynak: {$record['source']}\nTarih: {$now}"
    );
    rp_json_response(['ok' => true, 'message' => 'Bülten aboneliğiniz alınmıştır.']);
}

if ($type === 'verification') {
    $email = rp_valid_email(rp_required_string($payload, 'authorizedEmail', 'Yetkili e-postası'));
    $code = rp_verification_code();
    rp_save_verification($email, $code);

    $sent = rp_send_template_mail($email, 'email-verification', [
        'authorizedName' => trim((string)($payload['authorizedName'] ?? '')),
        'authorizedEmail' => $email,
        'companyName' => trim((string)($payload['companyName'] ?? '')),
        'verificationCode' => $code,
    ]);

    if (!$sent) {
        rp_json_response(['ok' => false, 'message' => 'Doğrulama kodu gönderilemedi. Mail ayarlarını kontrol edin.'], 502);
    }

    rp_json_response(['ok' => true, 'message' => 'Doğrulama kodu e-posta adresinize gönderildi.']);
}

if ($type === 'verify-code') {
    $email = rp_valid_email(rp_required_string($payload, 'authorizedEmail', 'Yetkili e-postası'));
    $code = preg_replace('/\D+/', '', rp_required_string($payload, 'verificationCode', 'Doğrulama kodu')) ?: '';
    if (!rp_check_verification($email, $code, false)) {
        rp_json_response(['ok' => false, 'message' => 'Doğrulama kodu hatalı veya süresi dolmuş.'], 422);
    }
    rp_json_response(['ok' => true, 'message' => 'E-posta doğrulandı.']);
}

if ($type === 'membership') {
    $companyName = rp_required_string($payload, 'companyName', 'Firma adı');
    $address = rp_required_string($payload, 'address', 'Firma adresi');
    $taxNo = rp_required_string($payload, 'taxNo', 'Vergi no');
    $taxOffice = rp_required_string($payload, 'taxOffice', 'Vergi dairesi');
    $authorizedName = rp_required_string($payload, 'authorizedName', 'Yetkili adı');
    $authorizedPhone = rp_required_string($payload, 'authorizedPhone', 'Yetkili telefonu');
    $authorizedEmail = rp_valid_email(rp_required_string($payload, 'authorizedEmail', 'Yetkili e-postası'));
    $verificationCode = preg_replace('/\D+/', '', (string)($payload['verificationCode'] ?? '')) ?: '';
    $password = (string)($payload['password'] ?? '');

    if (!preg_match('/^\d{10}$/', $taxNo)) {
        rp_json_response(['ok' => false, 'message' => 'Vergi no 10 haneli olmalı ve sadece rakam içermelidir.'], 422);
    }

    if (!preg_match('/^\d+$/', $authorizedPhone)) {
        rp_json_response(['ok' => false, 'message' => 'Telefon sadece rakamlardan oluşmalıdır.'], 422);
    }

    $content = rp_read_json(RACEPLAST_CONTENT_FILE, []);
    $verificationRequired = (bool)($content['membershipSettings']['emailVerificationRequired'] ?? true);
    if ($verificationRequired && !rp_check_verification($authorizedEmail, $verificationCode, true)) {
        rp_json_response(['ok' => false, 'message' => 'E-posta doğrulama kodu hatalı veya süresi dolmuş.'], 422);
    }

    $nilvera = rp_nilvera_tax_check($taxNo);
    if (($nilvera['checked'] ?? false) && !($nilvera['ok'] ?? false)) {
        rp_json_response(['ok' => false, 'message' => (string)($nilvera['message'] ?? 'Vergi numarası doğrulanamadı.')], 422);
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
        'emailVerified' => $verificationRequired ? true : !empty($payload['emailVerified']),
        'agreement' => !empty($payload['agreement']),
    ];
    if ($password !== '') {
        $record['passwordHash'] = password_hash($password, PASSWORD_DEFAULT);
    } elseif ($index >= 0 && isset($members[$index]['passwordHash'])) {
        $record['passwordHash'] = $members[$index]['passwordHash'];
    }
    if (!empty($nilvera['data'])) {
        $record['taxpayerCheck'] = [
            'provider' => 'Nilvera',
            'checkedAt' => $now,
            'data' => $nilvera['data'],
        ];
    }

    if ($index >= 0) {
        $members[$index] = array_merge($members[$index], $record);
    } else {
        $members[] = $record;
    }

    rp_write_json(RACEPLAST_MEMBERS_FILE, $members);
    rp_send_admin_notification(
        'Yeni Plastik24 üyelik başvurusu - ' . $companyName,
        "Yeni üyelik başvurusu alındı.\n\nFirma: {$companyName}\nVergi No: {$taxNo}\nVergi Dairesi: {$taxOffice}\nYetkili: {$authorizedName}\nTelefon: {$authorizedPhone}\nE-posta: {$authorizedEmail}\nTarih: {$now}"
    );
    rp_send_mail(
        $authorizedEmail,
        'Plastik24 üyelik başvurunuz alındı',
        "Merhaba {$authorizedName},\n\n{$companyName} adına oluşturduğunuz üyelik başvurusu alınmıştır. Firma bilgileriniz kontrol edildikten sonra hesabınız aktif edilecektir.\n\nPlastik24"
    );
    rp_json_response(['ok' => true, 'message' => 'Üyelik başvurunuz alınmıştır.']);
}

rp_json_response(['ok' => false, 'message' => 'Geçersiz kayıt türü.'], 422);

<?php
declare(strict_types=1);

require __DIR__ . '/common.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    rp_json_response(['ok' => false, 'message' => 'Sadece POST desteklenir.'], 405);
}

rp_require_auth();

$payload = rp_request_json();
$to = trim((string)($payload['to'] ?? ''));
$subject = trim((string)($payload['subject'] ?? 'Plastik24 test maili'));
$body = trim((string)($payload['body'] ?? 'Bu mail Plastik24 admin panelinden gönderilen test mesajıdır.'));
$settings = is_array($payload['settings'] ?? null)
    ? rp_normalize_mail_settings($payload['settings'])
    : rp_mail_settings();

if (!filter_var($to, FILTER_VALIDATE_EMAIL)) {
    rp_json_response(['ok' => false, 'message' => 'Geçerli bir test alıcısı girin.'], 422);
}

if ($subject === '') {
    $subject = 'Plastik24 test maili';
}

if ($body === '') {
    $body = 'Bu mail Plastik24 admin panelinden gönderilen test mesajıdır.';
}

$sent = rp_send_mail($to, $subject, $body, $settings);

if (!$sent) {
    rp_json_response([
        'ok' => false,
        'message' => 'Test maili gönderilemedi. SMTP sunucusu, kullanıcı adı, şifre ve port bilgilerini kontrol edin.',
    ], 502);
}

rp_json_response([
    'ok' => true,
    'message' => 'Test maili gönderildi.',
    'to' => $to,
]);

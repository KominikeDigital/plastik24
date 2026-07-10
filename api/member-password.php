<?php
declare(strict_types=1);

require __DIR__ . '/common.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    rp_json_response(['ok' => false, 'message' => 'Sadece POST desteklenir.'], 405);
}

function rp_member_password_email(array $payload): string
{
    $email = strtolower(trim((string)($payload['email'] ?? '')));
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        rp_json_response(['ok' => false, 'message' => 'Geçerli bir e-posta adresi girin.'], 422);
    }
    return $email;
}

function rp_member_find_index_by_email(array $members, string $email): int
{
    foreach ($members as $index => $member) {
        if (!is_array($member)) {
            continue;
        }
        if (strtolower(trim((string)($member['authorizedEmail'] ?? ''))) === $email) {
            return $index;
        }
    }
    return -1;
}

function rp_member_reset_key(string $email): string
{
    return 'password-reset:' . $email;
}

function rp_member_code(): string
{
    return (string)random_int(100000, 999999);
}

function rp_member_clean_code_records(array $records): array
{
    $now = time();
    return array_filter($records, static function ($record) use ($now): bool {
        return is_array($record) && (int)($record['expiresAt'] ?? 0) >= $now;
    });
}

function rp_member_save_reset_code(string $email, string $code): void
{
    $records = rp_member_clean_code_records(rp_read_json(RACEPLAST_VERIFICATION_FILE, []));
    $records[rp_member_reset_key($email)] = [
        'purpose' => 'password-reset',
        'email' => $email,
        'codeHash' => password_hash($code, PASSWORD_DEFAULT),
        'createdAt' => time(),
        'expiresAt' => time() + 20 * 60,
        'attempts' => 0,
    ];
    rp_write_json(RACEPLAST_VERIFICATION_FILE, $records);
}

function rp_member_check_reset_code(string $email, string $code, bool $consume = false): bool
{
    $records = rp_member_clean_code_records(rp_read_json(RACEPLAST_VERIFICATION_FILE, []));
    $key = rp_member_reset_key($email);
    $record = $records[$key] ?? null;
    if (!$record || !is_array($record)) {
        rp_write_json(RACEPLAST_VERIFICATION_FILE, $records);
        return false;
    }

    $record['attempts'] = (int)($record['attempts'] ?? 0) + 1;
    $ok = $record['attempts'] <= 6 && password_verify($code, (string)($record['codeHash'] ?? ''));
    if ($ok && $consume) {
        unset($records[$key]);
    } else {
        $records[$key] = $record;
    }
    rp_write_json(RACEPLAST_VERIFICATION_FILE, $records);
    return $ok;
}

$payload = rp_request_json();
$action = (string)($payload['action'] ?? '');
$email = rp_member_password_email($payload);
$members = rp_read_json(RACEPLAST_MEMBERS_FILE, []);
$memberIndex = rp_member_find_index_by_email($members, $email);

if ($action === 'request-reset') {
    if ($memberIndex < 0) {
        rp_json_response([
            'ok' => true,
            'message' => 'Bu e-posta kayıtlıysa şifre sıfırlama kodu gönderilecektir.',
        ]);
    }

    $member = $members[$memberIndex];
    $code = rp_member_code();
    rp_member_save_reset_code($email, $code);

    $name = trim((string)($member['authorizedName'] ?? $member['companyName'] ?? ''));
    $sent = rp_send_mail(
        $email,
        'Plastik24 şifre sıfırlama kodunuz',
        "Merhaba {$name},\n\nPlastik24 üye paneli şifrenizi sıfırlamak için doğrulama kodunuz: {$code}\n\nBu kod 20 dakika geçerlidir. İşlemi siz başlatmadıysanız bu e-postayı yok sayabilirsiniz.\n\nPlastik24"
    );

    if (!$sent) {
        rp_json_response([
            'ok' => false,
            'message' => 'Şifre sıfırlama e-postası gönderilemedi. Mail ayarlarını kontrol edin.',
            'mailSent' => false,
        ], 500);
    }

    rp_json_response([
        'ok' => true,
        'message' => 'Şifre sıfırlama kodu e-posta adresinize gönderildi.',
        'mailSent' => true,
    ]);
}

if ($action === 'reset') {
    if ($memberIndex < 0) {
        rp_json_response(['ok' => false, 'message' => 'Üye kaydı bulunamadı.'], 404);
    }

    $code = preg_replace('/\D+/', '', (string)($payload['code'] ?? '')) ?: '';
    $newPassword = (string)($payload['newPassword'] ?? '');

    if (strlen($newPassword) < 8) {
        rp_json_response(['ok' => false, 'message' => 'Yeni şifre en az 8 karakter olmalıdır.'], 422);
    }

    if (!rp_member_check_reset_code($email, $code, true)) {
        rp_json_response(['ok' => false, 'message' => 'Şifre sıfırlama kodu hatalı veya süresi dolmuş.'], 422);
    }

    $members[$memberIndex]['passwordHash'] = password_hash($newPassword, PASSWORD_DEFAULT);
    $members[$memberIndex]['status'] = 'approved';
    $members[$memberIndex]['updatedAt'] = gmdate('c');
    rp_write_json(RACEPLAST_MEMBERS_FILE, $members);

    rp_json_response(['ok' => true, 'message' => 'Şifreniz güncellendi. Yeni şifrenizle giriş yapabilirsiniz.']);
}

rp_json_response(['ok' => false, 'message' => 'Geçersiz işlem türü.'], 422);

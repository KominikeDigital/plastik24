<?php
declare(strict_types=1);

$isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
    || (isset($_SERVER['SERVER_PORT']) && (string)$_SERVER['SERVER_PORT'] === '443')
    || (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && strtolower((string)$_SERVER['HTTP_X_FORWARDED_PROTO']) === 'https');

session_name('raceplast_admin');
session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'secure' => $isHttps,
    'httponly' => true,
    'samesite' => 'Lax',
]);
session_start();

define('RACEPLAST_DATA_DIR', __DIR__ . '/data');
define('RACEPLAST_CONTENT_FILE', RACEPLAST_DATA_DIR . '/site-data.json');
define('RACEPLAST_MEMBERS_FILE', RACEPLAST_DATA_DIR . '/members.json');
define('RACEPLAST_NEWSLETTER_FILE', RACEPLAST_DATA_DIR . '/newsletter-subscribers.json');
define('RACEPLAST_MAIL_SETTINGS_FILE', RACEPLAST_DATA_DIR . '/mail-settings.json');
define('RACEPLAST_VERIFICATION_FILE', RACEPLAST_DATA_DIR . '/verification-codes.json');
define('RACEPLAST_FORM_SUBMISSIONS_FILE', RACEPLAST_DATA_DIR . '/form-submissions.json');
define('RACEPLAST_ADMIN_FILE', RACEPLAST_DATA_DIR . '/admin.json');
define('RACEPLAST_ORDERS_FILE', RACEPLAST_DATA_DIR . '/orders.json');
define('RACEPLAST_BACKUP_DIR', RACEPLAST_DATA_DIR . '/backups');
define('RACEPLAST_UPLOAD_DIR', dirname(__DIR__) . '/uploads/products');


function rp_json_response(array $payload, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function rp_storage_init(): void
{
    foreach ([RACEPLAST_DATA_DIR, RACEPLAST_BACKUP_DIR, RACEPLAST_UPLOAD_DIR] as $dir) {
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
    }
}

function rp_read_json(string $file, array $fallback = []): array
{
    if (!is_file($file)) {
        return $fallback;
    }

    $raw = file_get_contents($file);
    if ($raw === false || trim($raw) === '') {
        return $fallback;
    }

    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : $fallback;
}

function rp_write_json(string $file, array $payload): void
{
    $encoded = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    if ($encoded === false) {
        rp_json_response(['ok' => false, 'message' => 'JSON verisi hazırlanamadı.'], 500);
    }

    $tmp = $file . '.tmp';
    if (file_put_contents($tmp, $encoded . PHP_EOL, LOCK_EX) === false) {
        rp_json_response(['ok' => false, 'message' => 'Veri dosyası yazılamadı. Yazma iznini kontrol edin.'], 500);
    }

    if (!rename($tmp, $file)) {
        @unlink($tmp);
        rp_json_response(['ok' => false, 'message' => 'Veri dosyası güncellenemedi.'], 500);
    }
}

function rp_request_json(): array
{
    $raw = file_get_contents('php://input');
    $decoded = json_decode($raw ?: '', true);
    if (!is_array($decoded)) {
        rp_json_response(['ok' => false, 'message' => 'Geçersiz JSON isteği.'], 400);
    }
    return $decoded;
}

function rp_admin_defaults(): array
{
    return [
        'username' => 'admin',
        'passwordHash' => '$2y$12$H02YzzGLVqEupztIwngPv.LCp.wGZolEdshUY3cImNlC6PXPOy6LS',
        'updatedAt' => gmdate('c'),
    ];
}

function rp_get_admin(): array
{
    rp_storage_init();
    if (!is_file(RACEPLAST_ADMIN_FILE)) {
        rp_write_json(RACEPLAST_ADMIN_FILE, rp_admin_defaults());
    }
    return rp_read_json(RACEPLAST_ADMIN_FILE, rp_admin_defaults());
}

function rp_is_authenticated(): bool
{
    return !empty($_SESSION['raceplast_admin_auth']);
}

function rp_require_auth(): void
{
    if (!rp_is_authenticated()) {
        rp_json_response(['ok' => false, 'message' => 'Oturum gerekli.'], 401);
    }
}

function rp_backup_content(): void
{
    if (!is_file(RACEPLAST_CONTENT_FILE)) {
        return;
    }

    $target = RACEPLAST_BACKUP_DIR . '/site-data-' . gmdate('Ymd-His') . '.json';
    @copy(RACEPLAST_CONTENT_FILE, $target);
}

function rp_slug(string $value): string
{
    $value = trim($value);
    $value = preg_replace('/[^\pL\pN]+/u', '-', $value) ?: '';
    $value = trim($value, '-');
    $value = strtolower($value);
    return $value !== '' ? $value : 'item-' . time();
}

function rp_default_mail_settings(): array
{
    return [
        'defaultFromName' => 'Plastik24',
        'defaultFromEmail' => 'info@plastik24.com.tr',
        'notificationEmail' => 'info@plastik24.com.tr',
        'smtpHost' => 'mail.plastik24.com.tr',
        'smtpPort' => 465,
        'smtpSecure' => 'ssl',
        'smtpAuth' => true,
        'smtpUsername' => '_mainaccount@plastik24.com.tr',
        'smtpPassword' => 'plastik24.com.tr',
        'imapHost' => 'mail.plastik24.com.tr',
        'imapPort' => 993,
        'pop3Host' => 'mail.plastik24.com.tr',
        'pop3Port' => 995,
        'nilveraEnabled' => false,
        'nilveraApiBase' => 'https://apitest.nilvera.com',
        'nilveraApiKey' => '',
        'updatedAt' => gmdate('c'),
    ];
}

function rp_mail_settings(): array
{
    $settings = rp_read_json(RACEPLAST_MAIL_SETTINGS_FILE, []);
    return rp_normalize_mail_settings($settings);
}

function rp_normalize_mail_settings(array $settings = []): array
{
    $merged = array_merge(rp_default_mail_settings(), $settings);
    $merged['smtpPort'] = (int)($merged['smtpPort'] ?? 465);
    $merged['imapPort'] = (int)($merged['imapPort'] ?? 993);
    $merged['pop3Port'] = (int)($merged['pop3Port'] ?? 995);
    $merged['smtpAuth'] = (bool)($merged['smtpAuth'] ?? true);
    return $merged;
}

function rp_mime_header(string $value): string
{
    if (function_exists('mb_encode_mimeheader')) {
        return mb_encode_mimeheader($value, 'UTF-8', 'B', "\r\n");
    }
    return '=?UTF-8?B?' . base64_encode($value) . '?=';
}

function rp_smtp_read($socket): array
{
    $lines = [];
    while (($line = fgets($socket, 515)) !== false) {
        $lines[] = rtrim($line, "\r\n");
        if (strlen($line) < 4 || $line[3] !== '-') {
            break;
        }
    }
    $code = isset($lines[0]) ? (int)substr($lines[0], 0, 3) : 0;
    return [$code, $lines];
}

function rp_smtp_command($socket, string $command, array $acceptedCodes): bool
{
    if (fwrite($socket, $command . "\r\n") === false) {
        return false;
    }
    [$code] = rp_smtp_read($socket);
    return in_array($code, $acceptedCodes, true);
}

function rp_smtp_payload(string $subject, string $body, string $to, array $settings): string
{
    $fromName = trim((string)$settings['defaultFromName']);
    $fromEmail = trim((string)$settings['defaultFromEmail']);
    $headers = [
        'Date: ' . date(DATE_RFC2822),
        'From: ' . rp_mime_header($fromName) . ' <' . $fromEmail . '>',
        'To: <' . $to . '>',
        'Subject: ' . rp_mime_header($subject),
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: 8bit',
        'Reply-To: ' . $fromEmail,
        'X-Mailer: Plastik24',
    ];

    $payload = implode("\r\n", $headers) . "\r\n\r\n" . str_replace(["\r\n", "\r"], "\n", $body);
    $lines = explode("\n", $payload);
    $lines = array_map(static fn(string $line): string => $line !== '' && $line[0] === '.' ? '.' . $line : $line, $lines);
    return implode("\r\n", $lines);
}

function rp_smtp_send(string $to, string $subject, string $body, array $settings): bool
{
    $host = trim((string)$settings['smtpHost']);
    $port = (int)$settings['smtpPort'];
    $username = trim((string)$settings['smtpUsername']);
    $password = (string)$settings['smtpPassword'];
    $fromEmail = trim((string)$settings['defaultFromEmail']);

    if ($host === '' || $port <= 0 || $fromEmail === '' || $username === '' || $password === '') {
        return false;
    }

    $transport = ((string)$settings['smtpSecure'] === 'ssl' ? 'ssl://' : '') . $host;
    $socket = @stream_socket_client($transport . ':' . $port, $errno, $errstr, 20, STREAM_CLIENT_CONNECT);
    if (!$socket) {
        return false;
    }
    stream_set_timeout($socket, 20);

    [$code] = rp_smtp_read($socket);
    if ($code !== 220) {
        fclose($socket);
        return false;
    }

    $serverName = $_SERVER['SERVER_NAME'] ?? 'plastik24.com.tr';
    $ok = rp_smtp_command($socket, 'EHLO ' . $serverName, [250]);
    if (!$ok) {
        $ok = rp_smtp_command($socket, 'HELO ' . $serverName, [250]);
    }
    if (!$ok) {
        fclose($socket);
        return false;
    }

    if (!empty($settings['smtpAuth'])) {
        $ok = rp_smtp_command($socket, 'AUTH LOGIN', [334])
            && rp_smtp_command($socket, base64_encode($username), [334])
            && rp_smtp_command($socket, base64_encode($password), [235]);
        if (!$ok) {
            fclose($socket);
            return false;
        }
    }

    $payload = rp_smtp_payload($subject, $body, $to, $settings);
    $ok = rp_smtp_command($socket, 'MAIL FROM:<' . $fromEmail . '>', [250])
        && rp_smtp_command($socket, 'RCPT TO:<' . $to . '>', [250, 251])
        && rp_smtp_command($socket, 'DATA', [354]);
    if ($ok) {
        fwrite($socket, $payload . "\r\n.\r\n");
        [$dataCode] = rp_smtp_read($socket);
        $ok = $dataCode === 250;
    }

    rp_smtp_command($socket, 'QUIT', [221, 250]);
    fclose($socket);
    return $ok;
}

function rp_send_mail(string $to, string $subject, string $body, ?array $overrideSettings = null): bool
{
    $settings = $overrideSettings === null ? rp_mail_settings() : rp_normalize_mail_settings($overrideSettings);
    $to = trim($to);
    if (!filter_var($to, FILTER_VALIDATE_EMAIL)) {
        return false;
    }

    if (rp_smtp_send($to, $subject, $body, $settings)) {
        return true;
    }

    $fromEmail = trim((string)$settings['defaultFromEmail']);
    $fromName = trim((string)$settings['defaultFromName']);
    $headers = implode("\r\n", [
        'From: ' . rp_mime_header($fromName) . ' <' . $fromEmail . '>',
        'Reply-To: ' . $fromEmail,
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: 8bit',
    ]);

    return @mail($to, rp_mime_header($subject), $body, $headers, '-f' . $fromEmail);
}

function rp_render_mail_template(string $body, array $variables): string
{
    $replacements = [];
    foreach ($variables as $key => $value) {
        $replacements['{{' . $key . '}}'] = (string)$value;
    }
    return strtr($body, $replacements);
}

function rp_send_template_mail(string $to, string $trigger, array $variables): bool
{
    $content = rp_read_json(RACEPLAST_CONTENT_FILE, []);
    $emailSettings = $content['emailSettings'] ?? [];
    $templates = is_array($emailSettings['templates'] ?? null) ? $emailSettings['templates'] : [];
    $template = null;

    foreach ($templates as $candidate) {
        if (($candidate['trigger'] ?? '') === $trigger || ($candidate['id'] ?? '') === $trigger) {
            $template = $candidate;
            break;
        }
    }

    if (!$template || ($template['enabled'] ?? true) === false) {
        return false;
    }

    $subject = rp_render_mail_template((string)($template['subject'] ?? 'Plastik24 bildirimi'), $variables);
    $body = rp_render_mail_template((string)($template['body'] ?? ''), $variables);
    return rp_send_mail($to, $subject, $body);
}

rp_storage_init();

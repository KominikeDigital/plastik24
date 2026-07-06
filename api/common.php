<?php
declare(strict_types=1);

$isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
    || (isset($_SERVER['SERVER_PORT']) && (string)$_SERVER['SERVER_PORT'] === '443');

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
define('RACEPLAST_ADMIN_FILE', RACEPLAST_DATA_DIR . '/admin.json');
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

rp_storage_init();

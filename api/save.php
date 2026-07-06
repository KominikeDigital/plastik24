<?php
declare(strict_types=1);

require __DIR__ . '/common.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    rp_json_response(['ok' => false, 'message' => 'Sadece POST desteklenir.'], 405);
}

rp_require_auth();

$payload = rp_request_json();
$arrayFields = ['products', 'restStocks', 'sectors', 'heroSlides', 'blogPosts', 'legalPages', 'mediaLibrary', 'orders', 'members', 'newsletterSubscribers'];

foreach ($arrayFields as $key) {
    if (!isset($payload[$key])) {
        $payload[$key] = [];
    }
    if (!is_array($payload[$key])) {
        rp_json_response(['ok' => false, 'message' => "{$key} alanı liste olmalıdır."], 422);
    }
}

if (!isset($payload['settings']) || !is_array($payload['settings'])) {
    rp_json_response(['ok' => false, 'message' => 'Ayarlar eksik.'], 422);
}

if (!isset($payload['pageTexts']) || !is_array($payload['pageTexts'])) {
    rp_json_response(['ok' => false, 'message' => 'Sayfa metinleri eksik.'], 422);
}

$payload['schemaVersion'] = 1;
$payload['updatedAt'] = gmdate('c');
$members = $payload['members'];
$newsletterSubscribers = $payload['newsletterSubscribers'];
unset($payload['members'], $payload['newsletterSubscribers']);

foreach ($payload['products'] as $index => &$product) {
    if (empty($product['id'])) {
        $product['id'] = rp_slug((string)($product['name'] ?? 'product')) . '-' . ($index + 1);
    }
    if (empty($product['sku']) || empty($product['name'])) {
        rp_json_response(['ok' => false, 'message' => 'Her üründe SKU ve ürün adı zorunludur.'], 422);
    }
    $product['sortOrder'] = $product['sortOrder'] ?? ($index + 1);
}
unset($product);

rp_backup_content();
rp_write_json(RACEPLAST_MEMBERS_FILE, $members);
rp_write_json(RACEPLAST_NEWSLETTER_FILE, $newsletterSubscribers);
rp_write_json(RACEPLAST_CONTENT_FILE, $payload);

rp_json_response([
    'ok' => true,
    'message' => 'İçerik kaydedildi.',
    'updatedAt' => $payload['updatedAt'],
]);

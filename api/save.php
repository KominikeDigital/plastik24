<?php
declare(strict_types=1);

require __DIR__ . '/common.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    rp_json_response(['ok' => false, 'message' => 'Sadece POST desteklenir.'], 405);
}

rp_require_auth();

$payload = rp_request_json();
$arrayFields = ['products', 'restStocks', 'sectors', 'heroSlides', 'blogPosts', 'legalPages', 'mediaLibrary', 'members', 'newsletterSubscribers', 'formSubmissions'];

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
$formSubmissions = $payload['formSubmissions'];
$mailSettings = isset($payload['mailSettings']) && is_array($payload['mailSettings'])
    ? array_merge(rp_mail_settings(), $payload['mailSettings'], ['updatedAt' => gmdate('c')])
    : rp_mail_settings();

// Siparişler ayrı dosyaya yazılır (order-ship.php'nin yaptığı değişiklikler korunur)
if (isset($payload['orders']) && is_array($payload['orders'])) {
    $ordersFromAdmin = $payload['orders'];
    // Mevcut orders.json'dan receipt_url, trackingNumber, shippedAt gibi alanları koru
    $existingOrders = rp_read_json(RACEPLAST_ORDERS_FILE, []);
    $existingById = [];
    foreach ($existingOrders as $eo) {
        if (!is_array($eo)) continue;
        $existingById[(string)($eo['id'] ?? '')] = $eo;
    }
    foreach ($ordersFromAdmin as &$ao) {
        if (!is_array($ao)) continue;
        $eid = (string)($ao['id'] ?? '');
        if (isset($existingById[$eid])) {
            // Korunan alanlar
            foreach (['receiptUrl', 'trackingNumber', 'shippedAt', 'carrier', 'memberId'] as $protected) {
                if (!empty($existingById[$eid][$protected]) && empty($ao[$protected])) {
                    $ao[$protected] = $existingById[$eid][$protected];
                }
            }
        }
    }
    unset($ao);
    rp_write_json(RACEPLAST_ORDERS_FILE, $ordersFromAdmin);
}
unset($payload['orders']);

unset($payload['members'], $payload['newsletterSubscribers'], $payload['formSubmissions'], $payload['mailSettings']);

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
rp_write_json(RACEPLAST_FORM_SUBMISSIONS_FILE, $formSubmissions);
rp_write_json(RACEPLAST_MAIL_SETTINGS_FILE, $mailSettings);
rp_write_json(RACEPLAST_CONTENT_FILE, $payload);

rp_json_response([
    'ok' => true,
    'message' => 'İçerik kaydedildi.',
    'updatedAt' => $payload['updatedAt'],
]);

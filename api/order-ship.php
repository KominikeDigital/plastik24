<?php
declare(strict_types=1);

require __DIR__ . '/common.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    rp_json_response(['ok' => false, 'message' => 'Sadece POST desteklenir.'], 405);
}

// Admin oturumu gerektirir
rp_require_auth();

$payload        = rp_request_json();
$orderId        = trim((string)($payload['orderId'] ?? ''));
$trackingNumber = trim((string)($payload['trackingNumber'] ?? ''));
$carrier        = trim((string)($payload['carrier'] ?? ''));
$notes          = trim((string)($payload['notes'] ?? ''));

if ($orderId === '') {
    rp_json_response(['ok' => false, 'message' => 'Sipariş ID eksik.'], 422);
}

$orders = rp_read_json(RACEPLAST_ORDERS_FILE, []);

$orderIndex = -1;
foreach ($orders as $i => $order) {
    if (!is_array($order)) continue;
    if ((string)($order['id'] ?? '') === $orderId) {
        $orderIndex = $i;
        break;
    }
}

if ($orderIndex < 0) {
    rp_json_response(['ok' => false, 'message' => 'Sipariş bulunamadı.'], 404);
}

$order = $orders[$orderIndex];
$now   = gmdate('c');

$order['status']         = 'shipped';
$order['shippedAt']      = $now;
$order['trackingNumber'] = $trackingNumber;
$order['carrier']        = $carrier;
$order['updatedAt']      = $now;
if ($notes !== '') {
    $order['notes'] = trim((string)($order['notes'] ?? '') . "\n" . $notes);
}

$orders[$orderIndex] = $order;
rp_write_json(RACEPLAST_ORDERS_FILE, $orders);

// Müşteriye kargo bildirim maili gönder
$customerEmail = trim((string)($order['customerEmail'] ?? ''));
$customerName  = trim((string)($order['customerName'] ?? 'Müşteri'));
$orderNumber   = trim((string)($order['orderNumber'] ?? $orderId));
$companyName   = trim((string)($order['companyName'] ?? ''));

if ($customerEmail !== '') {
    $trackingLine = $trackingNumber
        ? "Kargo Takip No : {$trackingNumber}" . ($carrier ? " ({$carrier})" : '')
        : '';

    $body = <<<BODY
Merhaba {$customerName},

{$orderNumber} numaralı siparişiniz kargoya verilmiştir.

━━━━━━━━━━━━━━━━━━━━━━━━
SİPARİŞ NO : {$orderNumber}
{$trackingLine}
━━━━━━━━━━━━━━━━━━━━━━━━

Kargo firması tarafından tarafınıza teslim edilmesi beklenmektedir.
Herhangi bir sorunuz için info@plastik24.com.tr adresine yazabilirsiniz.

İyi günler,
Plastik24
BODY;

    rp_send_mail(
        $customerEmail,
        "Plastik24 – Siparişiniz Kargoya Verildi ({$orderNumber})",
        $body
    );
}

rp_json_response([
    'ok'      => true,
    'message' => 'Sipariş kargoya verildi ve müşteriye bildirim gönderildi.',
    'order'   => [
        'id'             => (string)($order['id'] ?? ''),
        'orderNumber'    => $orderNumber,
        'status'         => 'shipped',
        'shippedAt'      => $now,
        'trackingNumber' => $trackingNumber,
        'carrier'        => $carrier,
    ],
]);

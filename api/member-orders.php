<?php
declare(strict_types=1);

require __DIR__ . '/common.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    rp_json_response(['ok' => false, 'message' => 'Sadece GET desteklenir.'], 405);
}

$memberId = (string)($_SESSION['plastik24_member_id'] ?? '');
if ($memberId === '') {
    rp_json_response(['ok' => false, 'message' => 'Oturum bulunamadı.'], 401);
}

// orders.json dosyasından sadece bu üyeye ait siparişleri getir
$allOrders = rp_read_json(RACEPLAST_ORDERS_FILE, []);

$memberOrders = array_values(array_filter($allOrders, static function ($order) use ($memberId): bool {
    return is_array($order) && (string)($order['memberId'] ?? '') === $memberId;
}));

// En yeni sipariş önce
usort($memberOrders, static function ($a, $b): int {
    return strcmp((string)($b['createdAt'] ?? ''), (string)($a['createdAt'] ?? ''));
});

// Hassas alanları çıkar (passwordHash vb. yok ama güvenli tutalım)
$safeOrders = array_map(static function ($order): array {
    return [
        'id'            => (string)($order['id'] ?? ''),
        'orderNumber'   => (string)($order['orderNumber'] ?? ''),
        'status'        => (string)($order['status'] ?? 'pending'),
        'createdAt'     => (string)($order['createdAt'] ?? ''),
        'items'         => is_array($order['items'] ?? null) ? $order['items'] : [],
        'subtotal'      => $order['subtotal'] ?? 0,
        'taxTotal'      => $order['taxTotal'] ?? 0,
        'shippingTotal' => $order['shippingTotal'] ?? 0,
        'grandTotal'    => $order['grandTotal'] ?? 0,
        'currency'      => (string)($order['currency'] ?? 'EUR'),
        'paymentMethod' => (string)($order['paymentMethod'] ?? ''),
        'shippingMethod'=> (string)($order['shippingMethod'] ?? ''),
        'trackingNumber'=> (string)($order['trackingNumber'] ?? ''),
        'shippedAt'     => (string)($order['shippedAt'] ?? ''),
        'receiptUrl'    => (string)($order['receiptUrl'] ?? ''),
        'notes'         => (string)($order['notes'] ?? ''),
    ];
}, $memberOrders);

rp_json_response(['ok' => true, 'orders' => $safeOrders]);

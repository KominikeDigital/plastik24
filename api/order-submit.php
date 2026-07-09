<?php
declare(strict_types=1);

require __DIR__ . '/common.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    rp_json_response(['ok' => false, 'message' => 'Sadece POST desteklenir.'], 405);
}

$memberId = (string)($_SESSION['plastik24_member_id'] ?? '');
if ($memberId === '') {
    rp_json_response(['ok' => false, 'message' => 'Sipariş vermek için giriş yapmalısınız.'], 401);
}

$members = rp_read_json(RACEPLAST_MEMBERS_FILE, []);
$member = null;
foreach ($members as $candidate) {
    if (!is_array($candidate)) continue;
    if ((string)($candidate['id'] ?? '') === $memberId) {
        $member = $candidate;
        break;
    }
}

if (!$member || (string)($member['status'] ?? '') !== 'approved') {
    rp_json_response(['ok' => false, 'message' => 'Üyeliğiniz onaylı değil.'], 403);
}

$payload = rp_request_json();
$items = is_array($payload['items'] ?? null) ? $payload['items'] : [];

if (empty($items)) {
    rp_json_response(['ok' => false, 'message' => 'Sepet boş, sipariş oluşturulamaz.'], 422);
}

$now = gmdate('c');

// Benzersiz, kısa sipariş no
$orderNumber = 'P24-' . strtoupper(bin2hex(random_bytes(3)));

$orders = rp_read_json(RACEPLAST_ORDERS_FILE, []);

$subtotal      = (float)($payload['subtotal'] ?? 0);
$taxTotal      = (float)($payload['taxTotal'] ?? 0);
$shippingTotal = (float)($payload['shippingTotal'] ?? 0);
$grandTotal    = (float)($payload['grandTotal'] ?? ($subtotal + $taxTotal + $shippingTotal));
$currency      = trim((string)($payload['currency'] ?? 'EUR'));

$order = [
    'id'              => 'order-' . time() . '-' . bin2hex(random_bytes(3)),
    'orderNumber'     => $orderNumber,
    'memberId'        => $memberId,
    'status'          => 'pending',
    'createdAt'       => $now,
    'updatedAt'       => $now,
    'customerName'    => (string)($member['authorizedName'] ?? ''),
    'customerEmail'   => (string)($member['authorizedEmail'] ?? ''),
    'customerPhone'   => (string)($member['authorizedPhone'] ?? ''),
    'companyName'     => (string)($member['companyName'] ?? ''),
    'taxNo'           => (string)($member['taxNo'] ?? ''),
    'taxOffice'       => (string)($member['taxOffice'] ?? ''),
    'billingAddress'  => trim((string)($payload['billingAddress'] ?? $member['address'] ?? '')),
    'shippingAddress' => trim((string)($payload['shippingAddress'] ?? $payload['billingAddress'] ?? $member['address'] ?? '')),
    'paymentMethod'   => 'bank-transfer',
    'shippingMethod'  => trim((string)($payload['shippingMethod'] ?? '')),
    'currency'        => $currency,
    'subtotal'        => $subtotal,
    'taxTotal'        => $taxTotal,
    'shippingTotal'   => $shippingTotal,
    'grandTotal'      => $grandTotal,
    'items'           => $items,
    'notes'           => trim((string)($payload['notes'] ?? '')),
    'receiptUrl'      => '',
    'trackingNumber'  => '',
    'shippedAt'       => '',
];

array_unshift($orders, $order);
rp_write_json(RACEPLAST_ORDERS_FILE, $orders);

// Müşteriye onay maili
$itemLines = '';
foreach ($items as $item) {
    if (!is_array($item)) continue;
    $name = trim((string)($item['name'] ?? $item['productName'] ?? 'Ürün'));
    $qty  = (string)($item['quantity'] ?? $item['qty'] ?? 1);
    $sku  = trim((string)($item['sku'] ?? ''));
    $itemLines .= "- {$name}" . ($sku ? " [{$sku}]" : '') . " × {$qty}\n";
}

$customerBody = <<<BODY
Merhaba {$order['customerName']},

{$order['companyName']} adına verdiğiniz sipariş alındı.

━━━━━━━━━━━━━━━━━━━━━━━━
SİPARİŞ NUMARANIZ: {$orderNumber}
━━━━━━━━━━━━━━━━━━━━━━━━

Ürünler:
{$itemLines}
Toplam: {$grandTotal} {$currency}

Ödeme bilgilendirmesi:
Havale / EFT yapacaksanız dekontunuzun açıklama kısmına
"{$orderNumber}" sipariş numarasını yazmayı unutmayın.
Ayrıca dekontu info@plastik24.com.tr adresine de gönderebilirsiniz.

Siparişiniz incelendikten sonra kargo sürecine alınacak ve
kargo takip bilgisi tarafınıza iletilecektir.

Plastik24
BODY;

rp_send_mail(
    (string)($member['authorizedEmail'] ?? ''),
    "Plastik24 Sipariş Onayı – {$orderNumber}",
    $customerBody
);

// Admin bildirimi
$adminBody = <<<ADMIN
Yeni sipariş alındı.

Sipariş No : {$orderNumber}
Firma      : {$order['companyName']}
Müşteri    : {$order['customerName']}
E-posta    : {$order['customerEmail']}
Tarih      : {$now}
Toplam     : {$grandTotal} {$currency}

Ürünler:
{$itemLines}
ADMIN;

$settings = rp_mail_settings();
rp_send_mail(
    (string)($settings['notificationEmail'] ?? 'info@plastik24.com.tr'),
    "Plastik24 Yeni Sipariş – {$orderNumber}",
    $adminBody
);

rp_json_response([
    'ok'          => true,
    'message'     => 'Siparişiniz alındı.',
    'orderNumber' => $orderNumber,
    'orderId'     => $order['id'],
]);

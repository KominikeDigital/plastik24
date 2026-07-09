<?php
declare(strict_types=1);

require __DIR__ . '/common.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    rp_json_response(['ok' => false, 'message' => 'Sadece POST desteklenir.'], 405);
}

$memberId = (string)($_SESSION['plastik24_member_id'] ?? '');
if ($memberId === '') {
    rp_json_response(['ok' => false, 'message' => 'Giriş yapmalısınız.'], 401);
}

$orderId     = trim((string)($_POST['orderId'] ?? ''));
$orderNumber = trim((string)($_POST['orderNumber'] ?? ''));

if ($orderId === '' && $orderNumber === '') {
    rp_json_response(['ok' => false, 'message' => 'Sipariş bilgisi eksik.'], 422);
}

if (empty($_FILES['receipt']) || $_FILES['receipt']['error'] !== UPLOAD_ERR_OK) {
    rp_json_response(['ok' => false, 'message' => 'Dekont dosyası yüklenemedi.'], 422);
}

$file     = $_FILES['receipt'];
$ext      = strtolower(pathinfo((string)$file['name'], PATHINFO_EXTENSION));
$allowed  = ['jpg', 'jpeg', 'png', 'pdf', 'webp'];

if (!in_array($ext, $allowed, true)) {
    rp_json_response(['ok' => false, 'message' => 'Sadece JPG, PNG, WEBP veya PDF yükleyebilirsiniz.'], 422);
}

if ($file['size'] > 10 * 1024 * 1024) {
    rp_json_response(['ok' => false, 'message' => 'Dosya 10 MB\'dan büyük olamaz.'], 422);
}

$receiptDir = dirname(__DIR__) . '/uploads/receipts';
if (!is_dir($receiptDir)) {
    mkdir($receiptDir, 0755, true);
}

$filename = 'receipt-' . ($orderNumber ?: $orderId) . '-' . time() . '.' . $ext;
$destPath = $receiptDir . '/' . $filename;

if (!move_uploaded_file($file['tmp_name'], $destPath)) {
    rp_json_response(['ok' => false, 'message' => 'Dosya kaydedilemedi.'], 500);
}

$receiptUrl = 'uploads/receipts/' . $filename;

// Siparişe receipt_url ekle
$orders  = rp_read_json(RACEPLAST_ORDERS_FILE, []);
$updated = false;

foreach ($orders as &$order) {
    if (!is_array($order)) continue;
    $matchId     = $orderId !== '' && (string)($order['id'] ?? '') === $orderId;
    $matchNumber = $orderNumber !== '' && (string)($order['orderNumber'] ?? '') === $orderNumber;
    if ($matchId || $matchNumber) {
        // Güvenlik: sadece kendi siparişine yükleyebilir
        if ((string)($order['memberId'] ?? '') !== $memberId) {
            rp_json_response(['ok' => false, 'message' => 'Bu siparişe erişim yetkiniz yok.'], 403);
        }
        $order['receiptUrl']  = $receiptUrl;
        $order['updatedAt']   = gmdate('c');
        $order['status']      = 'processing';
        $updated = true;
        break;
    }
}
unset($order);

if ($updated) {
    rp_write_json(RACEPLAST_ORDERS_FILE, $orders);
}

// Admin bildirim
$settings = rp_mail_settings();
rp_send_mail(
    (string)($settings['notificationEmail'] ?? 'info@plastik24.com.tr'),
    "Plastik24 Dekont Yüklendi – {$orderNumber}",
    "Sipariş {$orderNumber} için dekont yüklendi.\n\nDekont URL: " . rtrim((string)($_SERVER['HTTP_HOST'] ?? ''), '/') . '/' . $receiptUrl
);

rp_json_response([
    'ok'         => true,
    'message'    => 'Dekontunuz başarıyla yüklendi.',
    'receiptUrl' => $receiptUrl,
]);

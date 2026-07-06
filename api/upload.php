<?php
declare(strict_types=1);

require __DIR__ . '/common.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    rp_json_response(['ok' => false, 'message' => 'Sadece POST desteklenir.'], 405);
}

rp_require_auth();

if (empty($_FILES['file']) || !is_uploaded_file($_FILES['file']['tmp_name'])) {
    rp_json_response(['ok' => false, 'message' => 'Yüklenecek dosya bulunamadı.'], 422);
}

$file = $_FILES['file'];
if ($file['error'] !== UPLOAD_ERR_OK) {
    rp_json_response(['ok' => false, 'message' => 'Dosya yükleme hatası.'], 422);
}

if ($file['size'] > 8 * 1024 * 1024) {
    rp_json_response(['ok' => false, 'message' => 'Görsel 8MB üstünde olamaz.'], 422);
}

$finfo = new finfo(FILEINFO_MIME_TYPE);
$mime = $finfo->file($file['tmp_name']);
$allowed = [
    'image/jpeg' => 'jpg',
    'image/png' => 'png',
    'image/webp' => 'webp',
    'image/gif' => 'gif',
];

if (!isset($allowed[$mime])) {
    rp_json_response(['ok' => false, 'message' => 'Sadece JPG, PNG, WEBP veya GIF yükleyebilirsiniz.'], 422);
}

$baseName = pathinfo((string)$file['name'], PATHINFO_FILENAME);
$safeName = rp_slug($baseName);
$extension = $allowed[$mime];
$finalName = $safeName . '-' . gmdate('Ymd-His') . '.' . $extension;
$target = RACEPLAST_UPLOAD_DIR . '/' . $finalName;

if (!move_uploaded_file($file['tmp_name'], $target)) {
    rp_json_response(['ok' => false, 'message' => 'Dosya kaydedilemedi. uploads klasörü yazılabilir olmalı.'], 500);
}

rp_json_response([
    'ok' => true,
    'url' => 'uploads/products/' . $finalName,
    'fileName' => $finalName,
]);

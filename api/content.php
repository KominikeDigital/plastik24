<?php
declare(strict_types=1);

require __DIR__ . '/common.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    rp_json_response(['ok' => false, 'message' => 'Sadece GET desteklenir.'], 405);
}

$content = rp_read_json(RACEPLAST_CONTENT_FILE, []);
if (!$content) {
    rp_json_response(['ok' => false, 'message' => 'İçerik dosyası henüz oluşturulmadı.'], 404);
}

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
echo json_encode($content, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

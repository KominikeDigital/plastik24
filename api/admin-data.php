<?php
declare(strict_types=1);

require __DIR__ . '/common.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    rp_json_response(['ok' => false, 'message' => 'Sadece GET desteklenir.'], 405);
}

rp_require_auth();

$content = rp_read_json(RACEPLAST_CONTENT_FILE, []);
if (!$content) {
    rp_json_response(['ok' => false, 'message' => 'İçerik dosyası henüz oluşturulmadı.'], 404);
}

$content['members'] = rp_read_json(RACEPLAST_MEMBERS_FILE, []);
$content['newsletterSubscribers'] = rp_read_json(RACEPLAST_NEWSLETTER_FILE, []);
$content['formSubmissions'] = rp_read_json(RACEPLAST_FORM_SUBMISSIONS_FILE, []);
$content['mailSettings'] = rp_mail_settings();

// Siparişler ayrı dosyadan okunur
$content['orders'] = rp_read_json(RACEPLAST_ORDERS_FILE, []);

rp_json_response([
    'ok' => true,
    'content' => $content,
]);

<?php
declare(strict_types=1);

require __DIR__ . '/common.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    rp_json_response(['ok' => false, 'message' => 'Sadece POST desteklenir.'], 405);
}

unset($_SESSION['plastik24_member_id'], $_SESSION['plastik24_member_email']);

rp_json_response(['ok' => true, 'message' => 'Üye oturumu kapatıldı.']);

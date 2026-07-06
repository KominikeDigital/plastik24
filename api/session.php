<?php
declare(strict_types=1);

require __DIR__ . '/common.php';

rp_json_response([
    'ok' => true,
    'authenticated' => rp_is_authenticated(),
    'username' => $_SESSION['raceplast_admin_user'] ?? null,
]);

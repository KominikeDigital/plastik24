<?php
declare(strict_types=1);

require __DIR__ . '/common.php';

$settings = rp_mail_settings();
echo "--- SMTP Settings ---\n";
print_r($settings);
echo "\n--- Attempting connection ---\n";

$host = trim((string)$settings['smtpHost']);
$port = (int)$settings['smtpPort'];
$username = trim((string)$settings['smtpUsername']);
$password = (string)$settings['smtpPassword'];
$fromEmail = trim((string)$settings['defaultFromEmail']);

$transport = ((string)$settings['smtpSecure'] === 'ssl' ? 'ssl://' : '') . $host;
echo "Connecting to: $transport on port $port...\n";

$socket = @stream_socket_client($transport . ':' . $port, $errno, $errstr, 10, STREAM_CLIENT_CONNECT);
if (!$socket) {
    echo "FAILED: Connection failed. Error $errno: $errstr\n";
    exit(1);
}

echo "SUCCESS: Socket connected.\n";
stream_set_timeout($socket, 10);

function read_smtp($socket) {
    $lines = [];
    while (($line = fgets($socket, 515)) !== false) {
        $l = rtrim($line, "\r\n");
        echo "S: $l\n";
        $lines[] = $l;
        if (strlen($line) < 4 || $line[3] !== '-') {
            break;
        }
    }
    return (int)substr($lines[0] ?? '0', 0, 3);
}

function write_smtp($socket, $cmd) {
    echo "C: $cmd\n";
    fwrite($socket, $cmd . "\r\n");
}

$code = read_smtp($socket);
if ($code !== 220) {
    echo "FAILED: Expected 220, got $code\n";
    fclose($socket);
    exit(1);
}

write_smtp($socket, "EHLO localhost");
read_smtp($socket);

if (!empty($settings['smtpAuth'])) {
    write_smtp($socket, "AUTH LOGIN");
    read_smtp($socket);
    write_smtp($socket, base64_encode($username));
    read_smtp($socket);
    write_smtp($socket, base64_encode($password));
    $code = read_smtp($socket);
    if ($code !== 235) {
        echo "FAILED: Auth failed. Expected 235, got $code\n";
        fclose($socket);
        exit(1);
    }
    echo "SUCCESS: Authenticated!\n";
}

write_smtp($socket, "QUIT");
read_smtp($socket);
fclose($socket);
echo "Done.\n";

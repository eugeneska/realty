<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
    respond(false, 'Метод не поддерживается.');
}

if ((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 20_000) {
    http_response_code(413);
    respond(false, 'Слишком большой запрос.');
}

loadEnv(__DIR__ . '/.env');

$payload = json_decode((string) file_get_contents('php://input'), true);
if (!is_array($payload)) {
    http_response_code(400);
    respond(false, 'Некорректный формат запроса.');
}

// Honeypot: bots often fill hidden fields.
if (trim((string) ($payload['website'] ?? '')) !== '') {
    respond(true, 'Заявка принята.');
}

rateLimit((string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown'));

$type = clean($payload['type'] ?? '', 30);
$name = clean($payload['name'] ?? '', 100);
$phone = clean($payload['phone'] ?? '', 50);

$labels = [
    'contacts' => 'Заявка из контактной формы',
    'quiz' => 'Заявка из квиза оценки квартиры',
    'checklist' => 'Запрос чек-листа',
];

if (!isset($labels[$type])) {
    http_response_code(422);
    respond(false, 'Неизвестный тип заявки.');
}

if ($type === 'checklist') {
    $contact = clean($payload['contact'] ?? '', 200);
    if (mb_strlen($contact) < 3) {
        http_response_code(422);
        respond(false, 'Укажите контакт для отправки чек-листа.');
    }
} else {
    if (mb_strlen($name) < 2 || mb_strlen($phone) < 7) {
        http_response_code(422);
        respond(false, 'Проверьте имя и телефон.');
    }
}

$smtpUser = env('SMTP_USER');
$smtpPassword = env('SMTP_PASSWORD');
$recipient = env('MAIL_TO');
$smtpHost = env('SMTP_HOST', 'smtp.mail.ru');
$smtpPort = (int) env('SMTP_PORT', '465');

if ($smtpUser === '' || $smtpPassword === '' || $recipient === '') {
    error_log('Lead mailer: SMTP settings are incomplete');
    http_response_code(500);
    respond(false, 'Отправка временно недоступна. Позвоните нам, пожалуйста.');
}

$fields = [
    'Тип' => $labels[$type],
    'Дата' => date('d.m.Y H:i:s'),
];

if ($type === 'checklist') {
    $fields['Контакт'] = $contact;
} else {
    $fields['Имя'] = $name;
    $fields['Телефон'] = $phone;
}

if ($type === 'quiz') {
    $fields += [
        'Объект' => clean($payload['object'] ?? '', 100),
        'Район' => clean($payload['district'] ?? '', 100),
        'Комнат' => clean($payload['rooms'] ?? '', 30),
        'Площадь' => clean($payload['area'] ?? '', 30),
        'Состояние' => clean($payload['condition'] ?? '', 100),
        'Срок продажи' => clean($payload['when'] ?? '', 100),
    ];
}

$fields['Страница'] = clean($payload['page'] ?? '', 500);
$fields['IP'] = clean($_SERVER['REMOTE_ADDR'] ?? '', 64);

$body = implode("\r\n", array_map(
    static fn (string $label, string $value): string => $label . ': ' . ($value !== '' ? $value : '—'),
    array_keys($fields),
    array_values($fields)
));

try {
    sendSmtpMail(
        $smtpHost,
        $smtpPort,
        $smtpUser,
        $smtpPassword,
        $recipient,
        $labels[$type],
        $body
    );
} catch (Throwable $error) {
    error_log('Lead mailer: ' . $error->getMessage());
    http_response_code(502);
    respond(false, 'Не удалось отправить заявку. Попробуйте ещё раз или позвоните нам.');
}

respond(true, 'Заявка успешно отправлена.');

function respond(bool $ok, string $message): void
{
    echo json_encode(['ok' => $ok, 'message' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

function clean($value, int $maxLength): string
{
    $value = trim(strip_tags((string) $value));
    $value = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $value) ?? '';
    return mb_substr($value, 0, $maxLength);
}

function env(string $key, string $default = ''): string
{
    $value = getenv($key);
    return $value === false ? $default : $value;
}

function loadEnv(string $path): void
{
    if (!is_readable($path)) {
        return;
    }

    foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [] as $line) {
        $line = trim($line);
        if ($line === '' || strpos($line, '#') === 0 || strpos($line, '=') === false) {
            continue;
        }

        [$key, $value] = array_map('trim', explode('=', $line, 2));
        if (!preg_match('/^[A-Z_][A-Z0-9_]*$/i', $key)) {
            continue;
        }

        if (strlen($value) >= 2) {
            $quote = $value[0];
            if (($quote === '"' || $quote === "'") && substr($value, -1) === $quote) {
                $value = substr($value, 1, -1);
            }
        }

        if (getenv($key) === false) {
            putenv($key . '=' . $value);
        }
    }
}

function rateLimit(string $ip): void
{
    $file = sys_get_temp_dir() . '/realty-lead-' . hash('sha256', $ip) . '.json';
    $now = time();
    $attempts = [];

    if (is_file($file)) {
        $attempts = json_decode((string) file_get_contents($file), true) ?: [];
    }

    $attempts = array_values(array_filter(
        $attempts,
        static fn (int $timestamp): bool => $timestamp > $now - 600
    ));

    if (count($attempts) >= 5) {
        http_response_code(429);
        respond(false, 'Слишком много попыток. Попробуйте через несколько минут.');
    }

    $attempts[] = $now;
    @file_put_contents($file, json_encode($attempts), LOCK_EX);
}

function sendSmtpMail(
    string $host,
    int $port,
    string $username,
    string $password,
    string $recipient,
    string $subject,
    string $body
): void {
    $context = stream_context_create([
        'ssl' => [
            'verify_peer' => true,
            'verify_peer_name' => true,
            'peer_name' => $host,
        ],
    ]);

    $socket = @stream_socket_client(
        'tls://' . $host . ':' . $port,
        $errorCode,
        $errorMessage,
        15,
        STREAM_CLIENT_CONNECT,
        $context
    );

    if ($socket === false) {
        throw new RuntimeException("SMTP connection failed ({$errorCode}): {$errorMessage}");
    }

    stream_set_timeout($socket, 15);

    try {
        smtpExpect($socket, [220]);
        smtpCommand($socket, 'EHLO ' . ($_SERVER['SERVER_NAME'] ?? 'localhost'), [250]);
        smtpCommand($socket, 'AUTH LOGIN', [334]);
        smtpCommand($socket, base64_encode($username), [334]);
        smtpCommand($socket, base64_encode($password), [235]);
        smtpCommand($socket, 'MAIL FROM:<' . $username . '>', [250]);
        smtpCommand($socket, 'RCPT TO:<' . $recipient . '>', [250, 251]);
        smtpCommand($socket, 'DATA', [354]);

        $encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
        $messageId = sprintf('<%s@%s>', bin2hex(random_bytes(12)), substr(strrchr($username, '@'), 1));
        $headers = [
            'Date: ' . date(DATE_RFC2822),
            'From: Realty <' . $username . '>',
            'To: <' . $recipient . '>',
            'Subject: ' . $encodedSubject,
            'Message-ID: ' . $messageId,
            'MIME-Version: 1.0',
            'Content-Type: text/plain; charset=UTF-8',
            'Content-Transfer-Encoding: base64',
        ];
        $encodedBody = rtrim(chunk_split(base64_encode($body), 76, "\r\n"));
        $message = implode("\r\n", $headers) . "\r\n\r\n" . $encodedBody;
        $message = preg_replace('/(?m)^\./', '..', $message) ?? $message;

        fwrite($socket, $message . "\r\n.\r\n");
        smtpExpect($socket, [250]);
        smtpCommand($socket, 'QUIT', [221]);
    } finally {
        fclose($socket);
    }
}

/**
 * @param resource $socket
 * @param list<int> $expectedCodes
 */
function smtpCommand($socket, string $command, array $expectedCodes): void
{
    fwrite($socket, $command . "\r\n");
    smtpExpect($socket, $expectedCodes);
}

/**
 * @param resource $socket
 * @param list<int> $expectedCodes
 */
function smtpExpect($socket, array $expectedCodes): void
{
    $response = '';

    while (($line = fgets($socket, 515)) !== false) {
        $response .= $line;
        if (strlen($line) >= 4 && $line[3] === ' ') {
            break;
        }
    }

    $meta = stream_get_meta_data($socket);
    if ($response === '' || $meta['timed_out']) {
        throw new RuntimeException('SMTP server did not respond');
    }

    $code = (int) substr($response, 0, 3);
    if (!in_array($code, $expectedCodes, true)) {
        throw new RuntimeException('SMTP error ' . $code . ': ' . trim($response));
    }
}

<?php
// send_mail.php - Отправка через Gmail SMTP

error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');

// Получаем данные
$data = json_decode(file_get_contents('php://input'), true);

if (!$data) {
    echo json_encode(['success' => false, 'error' => 'Нет данных']);
    exit;
}

// ===== НАСТРОЙКИ GMAIL =====
$gmail = 'gipsogen2008@gmail.com';        // ВАШ EMAIL
$password = 'kokmpwrjxnsspjof';       // ПАРОЛЬ ПРИЛОЖЕНИЯ

// Подключаем PHPMailer
require_once __DIR__ . '/PHPMailer/src/PHPMailer.php';
require_once __DIR__ . '/PHPMailer/src/SMTP.php';
require_once __DIR__ . '/PHPMailer/src/Exception.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

// Формируем письмо
$to = 'gipsogen2008@gmail.com';
$subject = $data['subject'] ?? 'Новый заказ из Стелы #' . date('His');

$message = "📋 НОВЫЙ ЗАКАЗ\n";
$message .= str_repeat("=", 50) . "\n\n";

$message .= "👤 КЛИЕНТ:\n";
$message .= "  ФИО: " . ($data['client_name'] ?? 'Не указано') . "\n";
$message .= "  Телефон: " . ($data['client_phone'] ?? 'Не указано') . "\n";
$message .= "  Email: " . ($data['client_email'] ?? 'Не указано') . "\n\n";

$message .= "🗿 ПАРАМЕТРЫ ЗАКАЗА:\n";
$message .= "  Режим: " . ($data['mode'] == 'engraving' ? 'Гравировка' : 'Фото-декаль') . "\n";
$message .= "  Камень: " . ($data['stone'] ?? 'Классический') . "\n";
$message .= "  Форма: " . ($data['shape'] ?? 'Без формы') . "\n";
$message .= "  Масштаб: " . ($data['scale'] ?? '0.8') . "\n";
$message .= "  Текстура: " . ($data['texture'] ?? 'Нет') . "\n\n";

$message .= "🎨 ОБРАБОТКА:\n";
$message .= "  Глубина: " . ($data['depth'] ?? '0.9') . "\n";
$message .= "  Ореол: " . ($data['halo'] ?? '35') . "\n";
$message .= "  Контраст: " . ($data['contrast'] ?? '3.0') . "\n";
$message .= "  Яркость: " . ($data['brightness'] ?? '0') . "\n\n";

$message .= "📐 ПОЗИЦИЯ:\n";
$message .= "  Смещение X: " . ($data['offset_x'] ?? '0') . "\n";
$message .= "  Смещение Y: " . ($data['offset_y'] ?? '0') . "\n";
$message .= "  Смещение Z: " . ($data['offset_z'] ?? '-0.1') . "\n\n";

$message .= "✂️ ОТСТУПЫ:\n";
$message .= "  Сверху: " . ($data['crop_top'] ?? '2') . "%\n";
$message .= "  Снизу: " . ($data['crop_bottom'] ?? '2') . "%\n";
$message .= "  Слева: " . ($data['crop_left'] ?? '2') . "%\n";
$message .= "  Справа: " . ($data['crop_right'] ?? '2') . "%\n\n";

if (!empty($data['notes'])) {
    $message .= "💬 КОММЕНТАРИЙ:\n";
    $message .= "  " . $data['notes'] . "\n\n";
}

$message .= str_repeat("=", 50) . "\n";
$message .= "📅 " . date('d.m.Y H:i:s') . "\n";

// ===== ОТПРАВКА =====
$mail = new PHPMailer(true);

try {
    // Настройки сервера
    $mail->SMTPDebug = 0; // 0 - отключить отладку, 1 - ошибки, 2 - подробно
    $mail->isSMTP();
    $mail->Host = 'smtp.gmail.com';
    $mail->SMTPAuth = true;
    $mail->Username = $gmail;
    $mail->Password = $password;
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port = 587;
    $mail->CharSet = 'UTF-8';

    // Отправитель и получатель
    $mail->setFrom($gmail, 'Стела');
    $mail->addAddress($to);
    
    // Если указан email клиента - добавляем в копию
    if (!empty($data['client_email']) && filter_var($data['client_email'], FILTER_VALIDATE_EMAIL)) {
        $mail->addReplyTo($data['client_email']);
    }

    // Контент
    $mail->isHTML(false);
    $mail->Subject = $subject;
    $mail->Body = $message;

    $mail->send();
    
    echo json_encode([
        'success' => true,
        'message' => 'Письмо отправлено на ' . $to
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Ошибка отправки: ' . $mail->ErrorInfo
    ]);
}
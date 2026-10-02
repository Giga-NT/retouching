<?php
// test_mail.php

require_once __DIR__ . '/PHPMailer/src/PHPMailer.php';
require_once __DIR__ . '/PHPMailer/src/SMTP.php';
require_once __DIR__ . '/PHPMailer/src/Exception.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

$mail = new PHPMailer(true);

try {
    $mail->SMTPDebug = 2;
    $mail->isSMTP();
    $mail->Host = 'smtp.gmail.com';
    $mail->SMTPAuth = true;
    $mail->Username = 'gipsogen2008@gmail.com';
    $mail->Password = 'ваш_пароль_приложения';  // <- вставьте пароль
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port = 587;
    $mail->CharSet = 'UTF-8';

    $mail->setFrom('gipsogen2008@gmail.com', 'Тест');
    $mail->addAddress('gipsogen2008@gmail.com');
    $mail->Subject = 'Тестовое письмо';
    $mail->Body = 'Тестовое письмо работает!';

    $mail->send();
    echo "✅ Письмо отправлено!";
} catch (Exception $e) {
    echo "❌ Ошибка: " . $mail->ErrorInfo;
}
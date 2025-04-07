<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'PHPMailer/PHPMailer.php';
require 'PHPMailer/SMTP.php';
require 'PHPMailer/Exception.php';

$mail = new PHPMailer(true);

try {
    $mail->isSMTP();
    $mail->Host = 'smtp.privateemail.com';
    $mail->SMTPAuth = true;
    $mail->Username = 'info@ibiticoin.com'; // замени на свой email
    $mail->Password = '1Vv19801979vV1';          // введи пароль от почты
    $mail->SMTPSecure = 'ssl';
    $mail->Port = 465;

    $mail->setFrom('info@ibiticoin.com', 'IBITIcoin');
    $mail->addAddress('info@ibiticoin.com');

    $mail->isHTML(true);
    $mail->Subject = 'Новое сообщение с сайта';
    $mail->Body    = "
        <b>Имя:</b> {$_POST['name']}<br>
        <b>Email:</b> {$_POST['email']}<br>
        <b>Сообщение:</b><br>{$_POST['message']}
    ";

    $mail->send();
    echo 'Сообщение отправлено!';
} catch (Exception $e) {
    echo "Ошибка при отправке: {$mail->ErrorInfo}";
}
?>

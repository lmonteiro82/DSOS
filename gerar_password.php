<?php
// Script para gerar hash de password
$password = 'admin123';
$hash = password_hash($password, PASSWORD_DEFAULT);

echo "Password: $password\n";
echo "Hash: $hash\n";
echo "\nCopie o hash acima e use no INSERT do SQL\n";
?>

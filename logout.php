<?php
session_start();
session_destroy();

// Limpar cookies de sessão
if (isset($_COOKIE[session_name()])) {
    setcookie(session_name(), '', time()-3600, '/');
}

// Redirecionar para login
header('Location: login.html');
exit();
?>

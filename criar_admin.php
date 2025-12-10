<?php
/**
 * Script para criar utilizador administrador
 * Execute este ficheiro no navegador: http://localhost:8000/criar_admin.php
 */

require_once 'config/database.php';

// Dados do admin
$nome = 'Administrador Geral';
$email = 'admin@rodasbengalas.pt';
$password = 'admin123';
$role = 'admin_geral';

try {
    $database = new Database();
    $db = $database->connect();
    
    // Verificar se já existe
    $query = "SELECT id FROM users WHERE email = :email";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':email', $email);
    $stmt->execute();
    
    if ($stmt->rowCount() > 0) {
        echo "<h2 style='color: orange;'>⚠️ Utilizador já existe!</h2>";
        echo "<p>Email: <strong>$email</strong></p>";
        echo "<p>Se esqueceu a password, elimine o utilizador na base de dados e execute este script novamente.</p>";
        exit;
    }
    
    // Criar hash da password
    $hashed_password = password_hash($password, PASSWORD_DEFAULT);
    
    // Inserir utilizador
    $query = "INSERT INTO users (nome, email, password, role, lar_id) 
              VALUES (:nome, :email, :password, :role, NULL)";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':nome', $nome);
    $stmt->bindParam(':email', $email);
    $stmt->bindParam(':password', $hashed_password);
    $stmt->bindParam(':role', $role);
    
    if ($stmt->execute()) {
        echo "<div style='font-family: Arial; max-width: 600px; margin: 50px auto; padding: 30px; background: #f0fdf4; border: 2px solid #10b981; border-radius: 12px;'>";
        echo "<h2 style='color: #059669; margin-top: 0;'>✅ Utilizador Criado com Sucesso!</h2>";
        echo "<div style='background: white; padding: 20px; border-radius: 8px; margin: 20px 0;'>";
        echo "<p><strong>Nome:</strong> $nome</p>";
        echo "<p><strong>Email:</strong> $email</p>";
        echo "<p><strong>Password:</strong> $password</p>";
        echo "<p><strong>Role:</strong> $role</p>";
        echo "</div>";
        echo "<p style='color: #059669;'><strong>Pode agora fazer login na aplicação!</strong></p>";
        echo "<p style='color: #dc2626; font-size: 14px;'>⚠️ Por segurança, elimine este ficheiro após criar o utilizador.</p>";
        echo "<a href='index.html' style='display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 10px;'>Ir para Login</a>";
        echo "</div>";
    }
    
} catch (PDOException $e) {
    echo "<div style='font-family: Arial; max-width: 600px; margin: 50px auto; padding: 30px; background: #fee2e2; border: 2px solid #ef4444; border-radius: 12px;'>";
    echo "<h2 style='color: #dc2626; margin-top: 0;'>❌ Erro ao Criar Utilizador</h2>";
    echo "<p><strong>Mensagem:</strong> " . $e->getMessage() . "</p>";
    echo "<p style='font-size: 14px; color: #991b1b;'>Verifique se:</p>";
    echo "<ul style='color: #991b1b;'>";
    echo "<li>A base de dados foi criada</li>";
    echo "<li>As tabelas foram criadas (execute phpmyadmin_setup.sql)</li>";
    echo "<li>As credenciais em config/database.php estão corretas</li>";
    echo "</ul>";
    echo "</div>";
}
?>

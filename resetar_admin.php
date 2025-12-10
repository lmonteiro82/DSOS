<?php
/**
 * Script para resetar o utilizador admin
 * Execute este ficheiro no navegador: http://localhost:8000/resetar_admin.php
 */

require_once 'config/database.php';

echo "<h1>Resetar Utilizador Admin</h1>";
echo "<hr>";

try {
    $database = new Database();
    $db = $database->connect();
    
    echo "<h2>✅ Conexão à base de dados: OK</h2>";
    
    // Eliminar utilizador antigo
    $query = "DELETE FROM users WHERE email = 'admin@rodasbengalas.pt'";
    $stmt = $db->prepare($query);
    $stmt->execute();
    
    echo "<h2>✅ Utilizador antigo eliminado</h2>";
    
    // Criar novo utilizador com password correta
    $nome = 'Administrador Geral';
    $email = 'admin@rodasbengalas.pt';
    $password = 'admin123';
    $role = 'admin_geral';
    
    // Criar hash da password
    $hashed_password = password_hash($password, PASSWORD_DEFAULT);
    
    echo "<h2>Criando novo utilizador...</h2>";
    echo "<p><strong>Password:</strong> $password</p>";
    echo "<p><strong>Hash gerado:</strong> <code style='font-size: 10px;'>$hashed_password</code></p>";
    
    // Inserir utilizador
    $query = "INSERT INTO users (nome, email, password, role, lar_id) 
              VALUES (:nome, :email, :password, :role, NULL)";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':nome', $nome);
    $stmt->bindParam(':email', $email);
    $stmt->bindParam(':password', $hashed_password);
    $stmt->bindParam(':role', $role);
    
    if ($stmt->execute()) {
        echo "<div style='margin: 30px 0; padding: 30px; background: #f0fdf4; border: 2px solid #10b981; border-radius: 12px;'>";
        echo "<h2 style='color: #059669; margin-top: 0;'>✅ UTILIZADOR CRIADO COM SUCESSO!</h2>";
        echo "<div style='background: white; padding: 20px; border-radius: 8px; margin: 20px 0;'>";
        echo "<p><strong>Email:</strong> $email</p>";
        echo "<p><strong>Password:</strong> $password</p>";
        echo "</div>";
        echo "<p style='color: #059669; font-size: 18px;'><strong>Agora pode fazer login!</strong></p>";
        echo "<a href='index.html' style='display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;'>IR PARA LOGIN</a>";
        echo "</div>";
        
        echo "<hr>";
        echo "<h3>Testar Login Agora:</h3>";
        echo "<button onclick='testarLogin()' style='padding: 12px 24px; background: #10b981; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;'>TESTAR LOGIN</button>";
        echo "<div id='resultado' style='margin-top: 20px;'></div>";
        
        echo "<script>
        async function testarLogin() {
            const resultado = document.getElementById('resultado');
            resultado.innerHTML = '<p>A testar login...</p>';
            
            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: '$email',
                        password: '$password'
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    resultado.innerHTML = '<div style=\"padding: 20px; background: #f0fdf4; border: 2px solid #10b981; border-radius: 8px;\"><h3 style=\"color: green;\">✅ LOGIN FUNCIONA PERFEITAMENTE!</h3><p>Pode agora usar a aplicação normalmente.</p></div>';
                } else {
                    resultado.innerHTML = '<div style=\"padding: 20px; background: #fee2e2; border: 2px solid #ef4444; border-radius: 8px;\"><h3 style=\"color: red;\">❌ Erro no Login</h3><pre>' + JSON.stringify(data, null, 2) + '</pre></div>';
                }
            } catch (error) {
                resultado.innerHTML = '<div style=\"padding: 20px; background: #fee2e2; border: 2px solid #ef4444; border-radius: 8px;\"><h3 style=\"color: red;\">❌ Erro</h3><p>' + error.message + '</p></div>';
            }
        }
        </script>";
    }
    
} catch (PDOException $e) {
    echo "<div style='padding: 30px; background: #fee2e2; border: 2px solid #ef4444; border-radius: 12px;'>";
    echo "<h2 style='color: #dc2626;'>❌ Erro</h2>";
    echo "<p>" . $e->getMessage() . "</p>";
    echo "</div>";
}
?>

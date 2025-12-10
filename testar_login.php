<?php
/**
 * Script de teste para verificar se o login funciona
 */

require_once 'config/database.php';

$email = 'admin@rodasbengalas.pt';
$password = 'admin123';

echo "<h1>Teste de Login</h1>";
echo "<hr>";

try {
    $database = new Database();
    $db = $database->connect();
    
    echo "<h2>✅ Conexão à base de dados: OK</h2>";
    
    // Buscar utilizador
    $query = "SELECT * FROM users WHERE email = :email";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':email', $email);
    $stmt->execute();
    
    if ($stmt->rowCount() === 0) {
        echo "<h2 style='color: red;'>❌ Utilizador não encontrado na base de dados!</h2>";
        echo "<p>Execute primeiro: <a href='criar_admin.php'>criar_admin.php</a></p>";
        exit;
    }
    
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo "<h2>✅ Utilizador encontrado:</h2>";
    echo "<ul>";
    echo "<li><strong>ID:</strong> " . $user['id'] . "</li>";
    echo "<li><strong>Nome:</strong> " . $user['nome'] . "</li>";
    echo "<li><strong>Email:</strong> " . $user['email'] . "</li>";
    echo "<li><strong>Role:</strong> " . $user['role'] . "</li>";
    echo "<li><strong>Ativo:</strong> " . ($user['ativo'] ? 'Sim' : 'Não') . "</li>";
    echo "</ul>";
    
    // Testar password
    echo "<h2>Teste de Password:</h2>";
    echo "<p>Password a testar: <strong>$password</strong></p>";
    echo "<p>Hash na BD: <code style='font-size: 10px;'>" . $user['password'] . "</code></p>";
    
    if (password_verify($password, $user['password'])) {
        echo "<h2 style='color: green;'>✅ PASSWORD CORRETA!</h2>";
        echo "<p>O login deve funcionar. Se não funciona, o problema está no JavaScript.</p>";
        echo "<hr>";
        echo "<h3>Teste a API diretamente:</h3>";
        echo "<button onclick='testarAPI()' style='padding: 10px 20px; background: #6366f1; color: white; border: none; border-radius: 8px; cursor: pointer;'>Testar API de Login</button>";
        echo "<div id='resultado' style='margin-top: 20px; padding: 20px; background: #f3f4f6; border-radius: 8px;'></div>";
        
        echo "<script>
        async function testarAPI() {
            const resultado = document.getElementById('resultado');
            resultado.innerHTML = '<p>A testar...</p>';
            
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
                    resultado.innerHTML = '<h3 style=\"color: green;\">✅ API FUNCIONA!</h3><pre>' + JSON.stringify(data, null, 2) + '</pre>';
                } else {
                    resultado.innerHTML = '<h3 style=\"color: red;\">❌ Erro na API</h3><pre>' + JSON.stringify(data, null, 2) + '</pre>';
                }
            } catch (error) {
                resultado.innerHTML = '<h3 style=\"color: red;\">❌ Erro</h3><p>' + error.message + '</p>';
            }
        }
        </script>";
        
    } else {
        echo "<h2 style='color: red;'>❌ PASSWORD INCORRETA!</h2>";
        echo "<p>O hash da password está errado. Execute novamente o criar_admin.php</p>";
        echo "<p><a href='criar_admin.php'>Criar Admin</a></p>";
    }
    
} catch (PDOException $e) {
    echo "<h2 style='color: red;'>❌ Erro de Conexão</h2>";
    echo "<p>" . $e->getMessage() . "</p>";
}
?>

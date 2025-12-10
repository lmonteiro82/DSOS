<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>Diagnóstico Completo do Sistema</h1>";
echo "<hr>";

// 1. Testar conexão à base de dados
echo "<h2>1. Teste de Conexão à Base de Dados</h2>";
try {
    require_once 'config/database.php';
    $database = new Database();
    $db = $database->connect();
    
    if ($db) {
        echo "<p style='color: green;'>✅ Conexão à base de dados: <strong>OK</strong></p>";
    } else {
        echo "<p style='color: red;'>❌ Falha na conexão</p>";
        exit;
    }
} catch (Exception $e) {
    echo "<p style='color: red;'>❌ Erro: " . $e->getMessage() . "</p>";
    exit;
}

// 2. Verificar se tabelas existem
echo "<h2>2. Verificar Tabelas</h2>";
try {
    $tables = ['lares', 'users', 'utentes', 'medicamentos', 'terapeuticas', 'stocks', 'administracoes'];
    foreach ($tables as $table) {
        $query = "SHOW TABLES LIKE '$table'";
        $stmt = $db->query($query);
        if ($stmt->rowCount() > 0) {
            echo "<p style='color: green;'>✅ Tabela <strong>$table</strong> existe</p>";
        } else {
            echo "<p style='color: red;'>❌ Tabela <strong>$table</strong> NÃO existe</p>";
        }
    }
} catch (Exception $e) {
    echo "<p style='color: red;'>❌ Erro: " . $e->getMessage() . "</p>";
}

// 3. Verificar utilizador admin
echo "<h2>3. Verificar Utilizador Admin</h2>";
try {
    $query = "SELECT * FROM users WHERE email = 'admin@rodasbengalas.pt'";
    $stmt = $db->query($query);
    
    if ($stmt->rowCount() === 0) {
        echo "<p style='color: orange;'>⚠️ Utilizador admin NÃO existe</p>";
        echo "<p><strong>Criando utilizador...</strong></p>";
        
        $nome = 'Administrador Geral';
        $email = 'admin@rodasbengalas.pt';
        $password = 'admin123';
        $role = 'admin_geral';
        $hashed_password = password_hash($password, PASSWORD_DEFAULT);
        
        $query = "INSERT INTO users (nome, email, password, role, lar_id) 
                  VALUES (:nome, :email, :password, :role, NULL)";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':nome', $nome);
        $stmt->bindParam(':email', $email);
        $stmt->bindParam(':password', $hashed_password);
        $stmt->bindParam(':role', $role);
        
        if ($stmt->execute()) {
            echo "<p style='color: green;'>✅ Utilizador criado com sucesso!</p>";
            echo "<p><strong>Email:</strong> $email</p>";
            echo "<p><strong>Password:</strong> $password</p>";
            echo "<p><strong>Hash:</strong> <code style='font-size: 10px;'>$hashed_password</code></p>";
        }
    } else {
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        echo "<p style='color: green;'>✅ Utilizador admin existe</p>";
        echo "<ul>";
        echo "<li><strong>ID:</strong> " . $user['id'] . "</li>";
        echo "<li><strong>Nome:</strong> " . $user['nome'] . "</li>";
        echo "<li><strong>Email:</strong> " . $user['email'] . "</li>";
        echo "<li><strong>Role:</strong> " . $user['role'] . "</li>";
        echo "<li><strong>Hash:</strong> <code style='font-size: 10px;'>" . $user['password'] . "</code></li>";
        echo "</ul>";
        
        // Testar password
        echo "<h3>Teste de Password:</h3>";
        $test_password = 'admin123';
        if (password_verify($test_password, $user['password'])) {
            echo "<p style='color: green;'>✅ Password '$test_password' está <strong>CORRETA</strong></p>";
        } else {
            echo "<p style='color: red;'>❌ Password '$test_password' está <strong>INCORRETA</strong></p>";
            echo "<p><strong>Recriando utilizador com password correta...</strong></p>";
            
            // Eliminar e recriar
            $db->query("DELETE FROM users WHERE email = 'admin@rodasbengalas.pt'");
            
            $nome = 'Administrador Geral';
            $email = 'admin@rodasbengalas.pt';
            $password = 'admin123';
            $role = 'admin_geral';
            $hashed_password = password_hash($password, PASSWORD_DEFAULT);
            
            $query = "INSERT INTO users (nome, email, password, role, lar_id) 
                      VALUES (:nome, :email, :password, :role, NULL)";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':nome', $nome);
            $stmt->bindParam(':email', $email);
            $stmt->bindParam(':password', $hashed_password);
            $stmt->bindParam(':role', $role);
            
            if ($stmt->execute()) {
                echo "<p style='color: green;'>✅ Utilizador recriado com password correta!</p>";
                echo "<p><strong>Novo Hash:</strong> <code style='font-size: 10px;'>$hashed_password</code></p>";
            }
        }
    }
} catch (Exception $e) {
    echo "<p style='color: red;'>❌ Erro: " . $e->getMessage() . "</p>";
}

// 4. Testar API de Login
echo "<h2>4. Testar API de Login</h2>";
echo "<button onclick='testarAPI()' style='padding: 12px 24px; background: #6366f1; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;'>TESTAR LOGIN VIA API</button>";
echo "<div id='resultado-api' style='margin-top: 20px; padding: 20px; background: #f3f4f6; border-radius: 8px;'></div>";

echo "<script>
async function testarAPI() {
    const resultado = document.getElementById('resultado-api');
    resultado.innerHTML = '<p>⏳ Testando API...</p>';
    
    try {
        const response = await fetch('/api/auth.php?action=login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                email: 'admin@rodasbengalas.pt',
                password: 'admin123'
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            resultado.innerHTML = '<h3 style=\"color: green;\">✅ API FUNCIONA PERFEITAMENTE!</h3><pre>' + JSON.stringify(data, null, 2) + '</pre><p><a href=\"index.html\" style=\"display: inline-block; margin-top: 20px; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;\">IR PARA LOGIN</a></p>';
        } else {
            resultado.innerHTML = '<h3 style=\"color: red;\">❌ Erro na API</h3><pre>' + JSON.stringify(data, null, 2) + '</pre>';
        }
    } catch (error) {
        resultado.innerHTML = '<h3 style=\"color: red;\">❌ Erro ao chamar API</h3><p>' + error.message + '</p><p>URL testada: /api/auth.php?action=login</p>';
    }
}
</script>";

echo "<hr>";
echo "<h2>Resumo</h2>";
echo "<p>Se todos os testes acima passaram (✅), o login deve funcionar.</p>";
echo "<p><strong>Credenciais:</strong></p>";
echo "<ul>";
echo "<li>Email: admin@rodasbengalas.pt</li>";
echo "<li>Password: admin123</li>";
echo "</ul>";
echo "<p><a href='index.html' style='display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;'>IR PARA LOGIN</a></p>";
?>

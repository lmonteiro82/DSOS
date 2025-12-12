<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

require_once '../config/database.php';

session_start();

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Não autorizado']);
    exit();
}

$database = new Database();
$db = $database->connect();

try {
    $query = "SELECT role, lar_id FROM users WHERE id = :user_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $_SESSION['user_id']);
    $stmt->execute();
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    $estatisticas = [];

    // Dashboard sempre mostra dados globais - Número de utentes por lar
    $query = "SELECT l.nome as lar, COUNT(u.id) as total_utentes
              FROM lares l
              LEFT JOIN utentes u ON l.id = u.lar_id AND u.ativo = 1
              WHERE l.ativo = 1
              GROUP BY l.id
              ORDER BY total_utentes DESC";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $estatisticas['utentes_por_lar'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Medicamentos mais usados - sempre global
    $query = "SELECT m.nome, m.principio_ativo, COUNT(t.id) as total_terapeuticas
              FROM medicamentos m
              JOIN terapeuticas t ON m.id = t.medicamento_id
              WHERE t.ativo = 1
              GROUP BY m.id
              ORDER BY total_terapeuticas DESC
              LIMIT 10";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $estatisticas['medicamentos_mais_usados'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Utentes que tomam mais medicamentos SOS - sempre global
    $query = "SELECT u.nome, u.numero_utente, l.nome as lar_nome, 
              COUNT(t.id) as total_sos
              FROM utentes u
              JOIN terapeuticas t ON u.id = t.utente_id
              JOIN lares l ON u.lar_id = l.id
              WHERE t.tipo = 'sos' AND t.ativo = 1
              GROUP BY u.id
              ORDER BY total_sos DESC
              LIMIT 10";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $estatisticas['utentes_mais_sos'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Stocks baixos (abaixo do mínimo) - sempre global
    $query = "SELECT s.*, m.nome as medicamento_nome, u.nome as utente_nome, 
              l.nome as lar_nome
              FROM stocks s
              JOIN medicamentos m ON s.medicamento_id = m.id
              JOIN utentes u ON s.utente_id = u.id
              JOIN lares l ON u.lar_id = l.id
              WHERE s.quantidade < s.quantidade_minima
              ORDER BY s.quantidade ASC";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $estatisticas['stocks_baixos'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Administrações pendentes de validação - sempre global
    $query = "SELECT COUNT(*) as total FROM administracoes WHERE validada = 0";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $estatisticas['administracoes_pendentes'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

    // Total de terapêuticas ativas - sempre global
    $query = "SELECT COUNT(*) as total FROM terapeuticas WHERE ativo = 1";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $estatisticas['total_terapeuticas'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

    echo json_encode(['success' => true, 'data' => $estatisticas]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erro: ' . $e->getMessage()]);
}
?>

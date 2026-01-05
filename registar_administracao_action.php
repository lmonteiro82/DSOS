<?php
session_start();
require_once 'config/database.php';

if (!isset($_SESSION['user_id'])) {
    header('Location: login.html');
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: administracoes.php');
    exit();
}

$database = new Database();
$db = $database->connect();

$terapeutica_id = intval($_POST['terapeutica_id']);
$data_hora = $_POST['data_hora'];
$administrada = isset($_POST['administrada']) && $_POST['administrada'] == '1' ? 1 : 0;
$motivo = $administrada ? null : ($_POST['motivo_nao_administracao'] ?? null);
$observacoes = $_POST['observacoes'] ?? null;

// Validações
if (empty($terapeutica_id) || empty($data_hora)) {
    $_SESSION['error'] = 'Preencha todos os campos obrigatórios';
    header('Location: administracoes.php');
    exit();
}

if (!$administrada && empty($motivo)) {
    $_SESSION['error'] = 'Deve indicar o motivo da não administração';
    header('Location: administracoes.php');
    exit();
}

try {
    // Obter terapeuta, lar_id, utente_id e medicamento_id da terapêutica
    $qTer = $db->prepare("SELECT t.criado_por, t.utente_id, t.medicamento_id, u.lar_id 
                          FROM terapeuticas t 
                          JOIN utentes u ON t.utente_id = u.id 
                          WHERE t.id = :tid");
    $qTer->bindParam(':tid', $terapeutica_id);
    $qTer->execute();
    $terRow = $qTer->fetch(PDO::FETCH_ASSOC);
    $terapeuta_id = $terRow ? intval($terRow['criado_por']) : $_SESSION['user_id'];
    $lar_id = $terRow ? intval($terRow['lar_id']) : null;
    $utente_id = $terRow ? intval($terRow['utente_id']) : null;
    $medicamento_id = $terRow ? intval($terRow['medicamento_id']) : null;
    
    if (!$lar_id) {
        $_SESSION['error'] = 'Erro: Lar não encontrado para esta terapêutica';
        header('Location: administracoes.php');
        exit();
    }

    // Inserir administração com lar_id
    $query = "INSERT INTO administracoes (terapeutica_id, lar_id, data_hora, administrada, 
              motivo_nao_administracao, observacoes, administrado_por, validada) 
              VALUES (:terapeutica_id, :lar_id, :data_hora, :administrada, :motivo, 
              :observacoes, :administrado_por, 0)";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':terapeutica_id', $terapeutica_id);
    $stmt->bindParam(':lar_id', $lar_id);
    $stmt->bindParam(':data_hora', $data_hora);
    $stmt->bindParam(':administrada', $administrada);
    $stmt->bindParam(':motivo', $motivo);
    $stmt->bindParam(':observacoes', $observacoes);
    $stmt->bindParam(':administrado_por', $terapeuta_id);

    if ($stmt->execute()) {
        $newId = $db->lastInsertId();

        // Se foi administrada, decrementar stock
        if ($administrada && $utente_id && $medicamento_id) {
            $stockQuery = "UPDATE stocks 
                           SET quantidade = quantidade - 1 
                           WHERE medicamento_id = :medicamento_id 
                           AND utente_id = :utente_id 
                           AND quantidade > 0";
            $stockStmt = $db->prepare($stockQuery);
            $stockStmt->bindParam(':medicamento_id', $medicamento_id);
            $stockStmt->bindParam(':utente_id', $utente_id);
            $stockStmt->execute();
        }

        // Se NÃO foi administrada, validar automaticamente
        if (!$administrada) {
            $auto = $db->prepare("UPDATE administracoes 
                                   SET validada = 1, validada_por = :uid, data_validacao = NOW()
                                   WHERE id = :id");
            $auto->bindParam(':uid', $_SESSION['user_id']);
            $auto->bindParam(':id', $newId);
            $auto->execute();
        }

        $_SESSION['success'] = 'Administração registada com sucesso';
    } else {
        $_SESSION['error'] = 'Erro ao registar administração';
    }
} catch (PDOException $e) {
    $_SESSION['error'] = 'Erro: ' . $e->getMessage();
}

header('Location: administracoes.php');
exit();
?>

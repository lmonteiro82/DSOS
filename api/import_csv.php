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

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['csv_file'])) {
    $lar_id = $_POST['lar_id'];
    
    $file = $_FILES['csv_file']['tmp_name'];
    
    if (!file_exists($file)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Ficheiro não encontrado']);
        exit();
    }

    try {
        $handle = fopen($file, 'r');
        $header = fgetcsv($handle, 1000, ',');
        
        $imported = 0;
        $errors = [];

        while (($data = fgetcsv($handle, 1000, ',')) !== FALSE) {
            if (count($data) < 5) {
                $errors[] = "Linha inválida: " . implode(',', $data);
                continue;
            }

            $nome = trim($data[0]);
            $principio_ativo = trim($data[1]);
            $marca = trim($data[2]);
            $dose = trim($data[3]);
            $toma = trim($data[4]);

            // Validar tipo de toma
            $tomas_validas = ['oral', 'injetavel', 'topica', 'sublingual', 'inalacao', 'retal', 'ocular', 'auricular', 'nasal'];
            if (!in_array($toma, $tomas_validas)) {
                $errors[] = "Tipo de toma inválido para $nome: $toma";
                continue;
            }

            $query = "INSERT INTO medicamentos (nome, principio_ativo, marca, dose, toma, minimo, validade, lar_id) 
                      VALUES (:nome, :principio_ativo, :marca, :dose, :toma, :minimo, :validade, :lar_id)";
            
            $stmt = $db->prepare($query);
            $stmt->bindParam(':nome', $nome);
            $stmt->bindParam(':principio_ativo', $principio_ativo);
            $stmt->bindParam(':marca', $marca);
            $stmt->bindParam(':dose', $dose);
            $stmt->bindParam(':toma', $toma);
            $stmt->bindValue(':minimo', 0, PDO::PARAM_INT);
            $stmt->bindValue(':validade', null, PDO::PARAM_NULL);
            $stmt->bindParam(':lar_id', $lar_id);

            if ($stmt->execute()) {
                $imported++;
            } else {
                $errors[] = "Erro ao importar: $nome";
            }
        }

        fclose($handle);

        echo json_encode([
            'success' => true,
            'message' => "$imported medicamentos importados com sucesso",
            'imported' => $imported,
            'errors' => $errors
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Erro ao importar: ' . $e->getMessage()]);
    }
} else {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Ficheiro CSV não fornecido']);
}
?>

<?php
class Database {
    private $host = '127.0.0.1';
    private $db_name = 'rodas_bengalas';
    private $username = 'root';
    private $password = 'senha123';
    private $conn;

    public function connect() {
        $this->conn = null;

        try {
            $this->conn = new PDO(
                'mysql:host=' . $this->host . ';dbname=' . $this->db_name,
                $this->username,
                $this->password
            );
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->exec("set names utf8mb4");
        } catch(PDOException $e) {
            echo 'Erro de conexão: ' . $e->getMessage();
        }

        return $this->conn;
    }
}
?>

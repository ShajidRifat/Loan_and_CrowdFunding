<?php

class Database {
    private $host = "127.0.0.1";
    private $db_name = "unifund_db";
    private $username = "root";
    private $password = ""; // Set your DB password
    public $conn;

    public function getConnection() {
        $this->conn = null;

        try {
            $this->conn = new PDO("mysql:host=" . $this->host . ";dbname=" . $this->db_name, $this->username, $this->password);
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
            $this->conn->exec("set names utf8");
        } catch(PDOException $exception) {
            header("Content-Type: application/json");
            echo json_encode(["message" => "Connection error: " . $exception->getMessage()]);
            exit;
        }

        return $this->conn;
    }
}

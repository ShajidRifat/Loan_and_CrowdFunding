<?php
class Campaign {
    private $conn;
    private $table_name = "campaigns";

    public $id;
    public $student_id;
    public $title;
    public $description;
    public $category;
    public $goal_amount;
    public $deadline;

    public function __construct($db) {
        $this->conn = $db;
    }

    // Create a new campaign
    public function create() {
        $query = "INSERT INTO " . $this->table_name . "
                SET
                    student_id = :student_id,
                    title = :title,
                    description = :description,
                    category = :category,
                    goal_amount = :goal_amount,
                    deadline = :deadline,
                    status = 'active'";

        $stmt = $this->conn->prepare($query);

        $this->title = htmlspecialchars(strip_tags($this->title));
        $this->description = htmlspecialchars(strip_tags($this->description));
        $this->category = htmlspecialchars(strip_tags($this->category));

        $stmt->bindParam(":student_id", $this->student_id);
        $stmt->bindParam(":title", $this->title);
        $stmt->bindParam(":description", $this->description);
        $stmt->bindParam(":category", $this->category);
        $stmt->bindParam(":goal_amount", $this->goal_amount);
        $stmt->bindParam(":deadline", $this->deadline);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }

    public function getAllActive() {
        $query = "SELECT c.*, u.full_name as student_name 
                  FROM " . $this->table_name . " c
                  JOIN users u ON c.student_id = u.id
                  WHERE c.status = 'active'
                  ORDER BY c.created_at DESC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    public function getById($id) {
        $query = "SELECT c.*, u.full_name as student_name 
                  FROM " . $this->table_name . " c
                  JOIN users u ON c.student_id = u.id
                  WHERE c.id = ? LIMIT 0,1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $id);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}
?>

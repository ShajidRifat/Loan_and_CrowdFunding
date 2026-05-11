<?php
class Loan {
    private $conn;
    private $table_name = "loans";

    public $id;
    public $student_id;
    public $amount_requested;
    public $purpose;
    public $duration_months;
    public $interest_rate;
    public $status;
    public $created_at;

    public function __construct($db) {
        $this->conn = $db;
    }

    // Create a new loan application
    public function create() {
        $query = "INSERT INTO " . $this->table_name . "
                SET
                    student_id = :student_id,
                    amount_requested = :amount_requested,
                    purpose = :purpose,
                    duration_months = :duration_months,
                    status = 'draft',
                    created_at = NOW()";

        $stmt = $this->conn->prepare($query);

        // Sanitize
        $this->purpose = htmlspecialchars(strip_tags($this->purpose));

        // Bind
        $stmt->bindParam(":student_id", $this->student_id);
        $stmt->bindParam(":amount_requested", $this->amount_requested);
        $stmt->bindParam(":purpose", $this->purpose);
        $stmt->bindParam(":duration_months", $this->duration_months);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }

    // Get loans by student ID
    public function getByStudentId($student_id) {
        $query = "SELECT * FROM " . $this->table_name . " WHERE student_id = ? ORDER BY created_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $student_id);
        $stmt->execute();
        return $stmt;
    }

    // Update loan status (e.g., submit, approve, reject)
    public function updateStatus($id, $status, $admin_id = null) {
        $query = "UPDATE " . $this->table_name . " SET status = :status";
        
        if ($status == 'approved_active') {
             $query .= ", approved_at = NOW(), admin_action_by = :admin_id";
        } elseif ($status == 'rejected') {
             $query .= ", admin_action_by = :admin_id";
        } else if ($status == 'pending') {
            $query .= ", applied_at = NOW()";
        }

        $query .= " WHERE id = :id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":status", $status);
        $stmt->bindParam(":id", $id);
        
        if ($admin_id) {
            $stmt->bindParam(":admin_id", $admin_id);
        }

        if($stmt->execute()) {
            return true;
        }
        return false;
    }
}
?>

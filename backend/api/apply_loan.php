<?php
// Headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With');

require_once 'db_config.php';

$data = json_decode(file_get_contents("php://input"));

// Validation
if (
    !empty($data->studentId) &&
    !empty($data->amount) && 
    !empty($data->purpose) &&
    !empty($data->duration) // Tenure in months
) {
    try {
        $pdo->beginTransaction();

        // 1. Resolve Status ID (Pending)
        $stmt = $pdo->prepare("SELECT status_id FROM loan_statuses WHERE status_name = 'pending'");
        $stmt->execute();
        $status_id = $stmt->fetchColumn();

        if (!$status_id) throw new Exception("Invalid Status");

        // 2. Insert Loan
        $stmt = $pdo->prepare("INSERT INTO loans (
            student_id, 
            status_id,
            title, 
            principal_amount, 
            interest_rate,
            tenure_months
        ) VALUES (?, ?, ?, ?, 5.00, ?)"); // 5% Flat Initial Interest
        
        if ($stmt->execute([
            $data->studentId,
            $status_id,
            $data->purpose, // Title
            $data->amount,
            $data->duration
        ])) {
            $loan_id = $pdo->lastInsertId();
            
            // Note: Installments are typically generated upon approval, not application.
            // Leaving installment generation for the admin approval phase or a separate process.

            $pdo->commit();
            http_response_code(201);
            echo json_encode(["message" => "Loan application submitted successfully", "loan_id" => $loan_id]);
        } else {
            throw new Exception("Unable to submit loan application");
        }
    } catch (Exception $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        http_response_code(500);
        echo json_encode(["message" => "Error: " . $e->getMessage()]);
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "Incomplete data"]);
}
?>

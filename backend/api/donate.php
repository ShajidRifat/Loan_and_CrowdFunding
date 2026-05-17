<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once 'db_config.php';

$data = json_decode(file_get_contents("php://input"));

if (
    !empty($data->campaign_id) &&
    !empty($data->donor_id) &&
    !empty($data->amount) &&
    $data->amount > 0
) {
    try {
        $pdo->beginTransaction();

        // 1. Get Campaign Owner (Student) for Transaction User ID
        $stmt = $pdo->prepare("SELECT student_id FROM campaigns WHERE campaign_id = ?");
        $stmt->execute([$data->campaign_id]);
        $student_id = $stmt->fetchColumn();

        if (!$student_id) throw new Exception("Campaign not found");

        // Check if campaign is active
        $stmt = $pdo->prepare("
            SELECT c.status_id, cs.status_name 
            FROM campaigns c 
            JOIN campaign_statuses cs ON c.status_id = cs.status_id 
            WHERE c.campaign_id = ?
        ");
        $stmt->execute([$data->campaign_id]);
        $campaign = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($campaign['status_name'] !== 'active') {
             throw new Exception("Campaign is not active. Donations are currently disabled.");
        }

        // 2. Insert into Transactions (Supertype)
        // In 3NF, the transaction is initiated by the donor.
        $stmt = $pdo->prepare("INSERT INTO transactions (user_id, amount) VALUES (?, ?)");
        $stmt->execute([$data->donor_id, $data->amount]);
        $transaction_id = $pdo->lastInsertId();

        // 3. Insert into Txn_Donations (Subtype)
        $stmt = $pdo->prepare("INSERT INTO txn_donations (transaction_id, campaign_id, message, is_anonymous) VALUES (?, ?, ?, ?)");
        $stmt->execute([
            $transaction_id,
            $data->campaign_id,
            $data->message ?? '',
            $data->is_anonymous ?? 0
        ]);

        $pdo->commit();

        http_response_code(201);
        echo json_encode(["message" => "Donation successful", "transaction_id" => $transaction_id]);

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

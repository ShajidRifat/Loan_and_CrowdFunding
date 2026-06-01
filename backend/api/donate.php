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

        // Check if campaign is active and fetch goal / raised amounts
        $stmt = $pdo->prepare("
            SELECT c.status_id, cs.status_name, c.goal_amount, COALESCE(s.raised_amount, 0) as raised_amount
            FROM campaigns c 
            JOIN campaign_statuses cs ON c.status_id = cs.status_id 
            LEFT JOIN vw_campaign_stats_pure s ON c.campaign_id = s.campaign_id
            WHERE c.campaign_id = ?
        ");
        $stmt->execute([$data->campaign_id]);
        $campaign = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($campaign['status_name'] !== 'active') {
             throw new Exception("Campaign is not active. Donations are currently disabled.");
        }

        // Fetch this donor's past cumulative donation to this campaign
        $stmt = $pdo->prepare("
            SELECT COALESCE(SUM(t.amount), 0)
            FROM transactions t
            JOIN txn_donations td ON t.transaction_id = td.transaction_id
            WHERE t.user_id = ? AND td.campaign_id = ?
        ");
        $stmt->execute([$data->donor_id, $data->campaign_id]);
        $already_donated = (float)$stmt->fetchColumn();

        $goal = (float)$campaign['goal_amount'];
        $raised = (float)$campaign['raised_amount'];
        $remaining_goal = max(0, $goal - $raised);

        // Max donation allowed for this transaction
        $donor_allowance = max(0, 50000 - $already_donated);
        $max_allowed = min($donor_allowance, $remaining_goal);

        if ($donor_allowance <= 0) {
            throw new Exception("You have already reached the lifetime donation limit of ৳50,000 for this campaign.");
        }

        if ($data->amount > $max_allowed) {
            throw new Exception("Maximum allowed donation for this transaction is ৳" . number_format($max_allowed, 2) . ".");
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

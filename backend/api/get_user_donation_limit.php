<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once 'db_config.php';

$campaign_id = isset($_GET['campaign_id']) ? $_GET['campaign_id'] : die();
$user_id = isset($_GET['user_id']) ? $_GET['user_id'] : die();

try {
    // 1. Fetch Campaign Details (goal and current raised)
    $stmt = $pdo->prepare("
        SELECT c.goal_amount, COALESCE(s.raised_amount, 0) as raised_amount
        FROM campaigns c
        LEFT JOIN vw_campaign_stats_pure s ON c.campaign_id = s.campaign_id
        WHERE c.campaign_id = ?
    ");
    $stmt->execute([$campaign_id]);
    $camp = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$camp) {
        http_response_code(404);
        echo json_encode(["message" => "Campaign not found"]);
        exit;
    }

    $goal = (float)$camp['goal_amount'];
    $raised = (float)$camp['raised_amount'];
    $remaining_goal = max(0, $goal - $raised);

    // 2. Fetch User's Cumulative Donation to this Campaign
    $stmt = $pdo->prepare("
        SELECT COALESCE(SUM(t.amount), 0)
        FROM transactions t
        JOIN txn_donations td ON t.transaction_id = td.transaction_id
        WHERE t.user_id = ? AND td.campaign_id = ?
    ");
    $stmt->execute([$user_id, $campaign_id]);
    $already_donated = (float)$stmt->fetchColumn();

    echo json_encode([
        "already_donated" => $already_donated,
        "remaining_goal" => $remaining_goal,
        "goal_amount" => $goal,
        "raised_amount" => $raised
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}
?>

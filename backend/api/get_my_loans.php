<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once 'db_config.php';

$user_id = isset($_GET['user_id']) ? $_GET['user_id'] : die();

try {
    $stmt = $pdo->prepare("
        SELECT 
            l.loan_id as id,
            l.student_id,
            l.status_id,
            l.title,
            l.principal_amount,
            l.interest_rate,
            l.tenure_months,
            s.status_name as status,
            l.applied_at as applied_at,
            COALESCE((
                SELECT SUM(ABS(t.amount))
                FROM transactions t
                JOIN txn_repayments tr ON t.transaction_id = tr.transaction_id
                JOIN loan_installments li ON tr.installment_id = li.installment_id
                WHERE li.loan_id = l.loan_id
            ), 0) as amount_paid
        FROM loans l
        JOIN loan_statuses s ON l.status_id = s.status_id
        WHERE l.student_id = ? 
        ORDER BY l.loan_id DESC
    ");
    $stmt->execute([$user_id]);
    $loans = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($loans);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}
?>

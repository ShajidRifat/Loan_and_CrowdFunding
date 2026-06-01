<?php
// Headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With');

require_once 'db_config.php';
require_once 'core/ScoreEngine.php';

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->loan_id) && !empty($data->amount) && !empty($data->user_id)) {
    try {
        $pdo->beginTransaction();

        // 0. Verify Loan Ownership
        $check = $pdo->prepare("SELECT student_id FROM loans WHERE loan_id = ?");
        $check->execute([$data->loan_id]);
        $owner_id = $check->fetchColumn();

        if ($owner_id != $data->user_id) {
            throw new Exception("Unauthorized: Loan does not belong to this user.");
        }

        // 1. Identify Installment(s) & Distribute Payment
        $installment_id = $data->installment_id ?? null;
        $remaining_payment = $data->amount;
        $processed_transactions = [];

        if ($installment_id) {
            // SINGLE INSTALLMENT PAYMENT
            // -----------------------------------------
            $stmt = $pdo->prepare("SELECT installment_amount FROM loan_installments WHERE installment_id = ?");
            $stmt->execute([$installment_id]);
            $target_amount = $stmt->fetchColumn();
            
            if (!$target_amount) throw new Exception("Installment not found.");
            
            // Check paid
            $p_stmt = $pdo->prepare("
                SELECT COALESCE(SUM(ABS(t.amount)), 0) 
                FROM transactions t 
                JOIN txn_repayments tr ON t.transaction_id = tr.transaction_id 
                WHERE tr.installment_id = ?
            ");
            $p_stmt->execute([$installment_id]);
            $current_paid = $p_stmt->fetchColumn();
            
            $remaining_due = $target_amount - $current_paid;
            if ($remaining_payment > $remaining_due) {
                throw new Exception("Payment amount ($remaining_payment) exceeds remaining due ($remaining_due) for this installment.");
            }

            // Process Transaction
            $stmt = $pdo->prepare("INSERT INTO transactions (user_id, amount) VALUES (?, ?)");
            $stmt->execute([$data->user_id, -abs($remaining_payment)]);
            $tid = $pdo->lastInsertId();

            $stmt = $pdo->prepare("INSERT INTO txn_repayments (transaction_id, installment_id) VALUES (?, ?)");
            $stmt->execute([$tid, $installment_id]);
            
            $processed_transactions[] = $tid;

        } else {
            // BULK / AUTOMATIC DISTRIBUTION
            // -----------------------------------------
            // Fetch all installments that are not fully paid
            // We can't easily filter by 'paid' status in SQL without a complex join/group by, 
            // so we fetch all and filter in PHP or use a smarter query.
            // Helper query to get installments with their paid amount
            $stmt = $pdo->prepare("
                SELECT li.installment_id, li.installment_amount, 
                       COALESCE(SUM(ABS(t.amount)), 0) as paid_amount
                FROM loan_installments li
                LEFT JOIN txn_repayments tr ON li.installment_id = tr.installment_id
                LEFT JOIN transactions t ON tr.transaction_id = t.transaction_id
                WHERE li.loan_id = ?
                GROUP BY li.installment_id
                ORDER BY li.due_date ASC
            ");
            $stmt->execute([$data->loan_id]);
            $installments = $stmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($installments as $inst) {
                if ($remaining_payment <= 0) break;

                $due = $inst['installment_amount'] - $inst['paid_amount'];
                
                if ($due > 0.01) { // Floating point tolerance
                    $to_pay = min($remaining_payment, $due);
                    
                    // Process Transaction for this chunk
                    $stmt = $pdo->prepare("INSERT INTO transactions (user_id, amount) VALUES (?, ?)");
                    $stmt->execute([$data->user_id, -abs($to_pay)]);
                    $tid = $pdo->lastInsertId();

                    $stmt = $pdo->prepare("INSERT INTO txn_repayments (transaction_id, installment_id) VALUES (?, ?)");
                    $stmt->execute([$tid, $inst['installment_id']]);
                    
                    $processed_transactions[] = $tid;
                    $remaining_payment -= $to_pay;
                }
            }
            
            if (empty($processed_transactions) && $data->amount > 0) {
                 throw new Exception("No pending installments found to apply this payment.");
            }
            
            // If there's still money left over, we could store it as wallet credit or overpayment?
            // For now, strict check:
             if ($remaining_payment > 1.00) { // Allow small epsilon
                // Rollback is unsafe if we already processed some? No, we are in transaction.
                 throw new Exception("Payment amount exceeds total outstanding balance by " . $remaining_payment);
            }
        }

        // Check for Loan Completion
        
        // Calculate Total Paid for THIS loan
        // Note: We need to sum up transactions linked to installments of this loan
        $stmt = $pdo->prepare("
            SELECT COALESCE(SUM(ABS(t.amount)), 0)
            FROM transactions t
            JOIN txn_repayments tr ON t.transaction_id = tr.transaction_id
            JOIN loan_installments li ON tr.installment_id = li.installment_id
            WHERE li.loan_id = ?
        ");
        $stmt->execute([$data->loan_id]);
        $total_paid = $stmt->fetchColumn();

        // Calculate Total Expected (Sum of all installments)
        $stmt = $pdo->prepare("SELECT SUM(installment_amount) FROM loan_installments WHERE loan_id = ?");
        $stmt->execute([$data->loan_id]);
        $total_expected = $stmt->fetchColumn();

        // If fully paid (allow margin for float precision)
        $isFullyPaid = ($total_expected - $total_paid) < 1.00;
        if ($isFullyPaid) {
            // Resolve paid status ID dynamically from the DB to avoid lookup anomalies
            $status_stmt = $pdo->prepare("SELECT status_id FROM loan_statuses WHERE status_name = 'paid'");
            $status_stmt->execute();
            $paid_status_id = $status_stmt->fetchColumn() ?: 5;

            $stmt = $pdo->prepare("UPDATE loans SET status_id = ? WHERE loan_id = ?");
            $stmt->execute([$paid_status_id, $data->loan_id]);

            // Trigger EVT_02 (+25) for full repayment
            ScoreEngine::applyEvent((int)$data->user_id, 'EVT_02', 'repayment_api', $pdo);
        } else {
            // === DYNAMIC RESCHEDULING ENGINE ===
            $remaining_balance = $total_expected - $total_paid;
            
            // Identify remaining active installments
            $stmt = $pdo->prepare("
                SELECT li.installment_id, li.installment_amount, 
                       COALESCE(SUM(ABS(t.amount)), 0) as paid_amount
                FROM loan_installments li
                LEFT JOIN txn_repayments tr ON li.installment_id = tr.installment_id
                LEFT JOIN transactions t ON tr.transaction_id = t.transaction_id
                WHERE li.loan_id = ?
                GROUP BY li.installment_id
                HAVING paid_amount < li.installment_amount - 1.00 
                ORDER BY li.due_date ASC
            ");
            $stmt->execute([$data->loan_id]);
            $remaining_installments = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $remaining_months = count($remaining_installments);
            
            if ($remaining_months > 0) {
                // Compound 5% Interest on remaining balance
                $interest = $remaining_balance * 0.05;
                $new_balance = $remaining_balance + $interest;
                
                // Reschedule: Equal distribution of the new remaining balance
                $new_installment_amount = $new_balance / $remaining_months;
                
                $update_stmt = $pdo->prepare("UPDATE loan_installments SET installment_amount = ? WHERE installment_id = ?");
                foreach ($remaining_installments as $inst) {
                    // Set the installment amount such that the *due* amount is exactly $new_installment_amount
                    $adjusted_amount = $new_installment_amount + $inst['paid_amount'];
                    $update_stmt->execute([$adjusted_amount, $inst['installment_id']]);
                }
            }
        }

        // Trigger EVT_01 (+10) for successful installment repayment
        ScoreEngine::applyEvent((int)$data->user_id, 'EVT_01', 'repayment_api', $pdo);

        $pdo->commit();

        http_response_code(200);
        echo json_encode(["message" => "Repayment processed successfully", "transaction_ids" => $processed_transactions]);

    } catch (Exception $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        http_response_code(500);
        echo json_encode(["message" => "Error: " . $e->getMessage()]);
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "Incomplete data."]);
}
?>

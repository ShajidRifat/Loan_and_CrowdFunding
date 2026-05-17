<?php
// Headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once 'db_config.php';

$user_id = $_GET['user_id'] ?? null;

if (!$user_id) {
    http_response_code(400);
    echo json_encode(["message" => "User ID required"]);
    exit;
}

// Fetch all transactions involving this user (either as source or destination)
// Determine type based on subtypes
$query = "
    SELECT 
        t.transaction_id as id, 
        CASE 
            WHEN td.transaction_id IS NOT NULL THEN -ABS(t.amount) -- Donor sending money
            WHEN tr.transaction_id IS NOT NULL THEN -ABS(t.amount) -- Student repaying loan
            ELSE t.amount -- Student receiving money (disbursement)
        END as amount,
        t.created_at, 
        t.transaction_id as reference_id,
        CASE 
            WHEN td.transaction_id IS NOT NULL THEN 'donation_sent'
            WHEN tr.transaction_id IS NOT NULL THEN 'repayment'
            ELSE 'transaction'
        END as type,
        CASE 
            WHEN td.transaction_id IS NOT NULL THEN COALESCE(td.message, 'Donation')
            WHEN tr.transaction_id IS NOT NULL THEN CONCAT('Repayment for Installment #', tr.installment_id)
            ELSE 'Generic Transaction'
        END as description,
        'completed' as status
    FROM transactions t
    LEFT JOIN txn_donations td ON t.transaction_id = td.transaction_id
    LEFT JOIN txn_repayments tr ON t.transaction_id = tr.transaction_id
    WHERE t.user_id = ?
    
    UNION ALL
    
    -- Part 2: Transactions where the user is the RECIPIENT (Student receiving donations)
    SELECT 
        t.transaction_id as id, 
        t.amount as amount, -- Student receiving money (+)
        t.created_at, 
        t.transaction_id as reference_id,
        'donation_received' as type,
        COALESCE(td.message, 'Donation Received') as description,
        'completed' as status
    FROM transactions t
    JOIN txn_donations td ON t.transaction_id = td.transaction_id
    JOIN campaigns c ON td.campaign_id = c.campaign_id
    WHERE c.student_id = ?
    
    ORDER BY created_at DESC
";

try {
    // Check Role
    $stmt = $pdo->prepare("SELECT role_id FROM users WHERE user_id = ?");
    $stmt->execute([$user_id]);
    $role_id = $stmt->fetchColumn();

    // Role ID 3 = Admin (from setup.sql)
    $isAdmin = ($role_id == 3);

    if ($isAdmin) {
        $query = "
            SELECT 
                t.transaction_id as id, 
                t.amount,
                t.created_at, 
                t.transaction_id as reference_id,
                CASE 
                    WHEN td.transaction_id IS NOT NULL THEN 'donation'
                    WHEN tr.transaction_id IS NOT NULL THEN 'repayment'
                    ELSE 'transaction'
                END as type,
                CASE 
                    WHEN td.transaction_id IS NOT NULL THEN CONCAT('Donation to ', c.title, ' by ', u.full_name)
                    WHEN tr.transaction_id IS NOT NULL THEN CONCAT('Repayment from ', u.full_name)
                    ELSE CONCAT('Transaction by ', u.full_name)
                END as description,
                'completed' as status
            FROM transactions t
            LEFT JOIN users u ON t.user_id = u.user_id
            LEFT JOIN txn_donations td ON t.transaction_id = td.transaction_id
            LEFT JOIN campaigns c ON td.campaign_id = c.campaign_id
            LEFT JOIN txn_repayments tr ON t.transaction_id = tr.transaction_id
            ORDER BY t.created_at DESC
        ";
        $stmt = $pdo->prepare($query);
        $stmt->execute();
    } else {
        $stmt = $pdo->prepare($query); 
        $stmt->execute([$user_id, $user_id]); // Params for UNION query (actor, recipient)
    }
    
    $transactions = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($transactions);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Database error: " . $e->getMessage()]);
}
?>

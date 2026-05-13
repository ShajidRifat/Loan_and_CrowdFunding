<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}
require_once 'db_config.php';

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->email) && !empty($data->password)) {
    try {
        // Updated query to join lookup tables
        $stmt = $pdo->prepare("
            SELECT u.user_id as id, u.full_name, u.email, u.password_hash, 
                   r.role_name as role, s.status_name as status 
            FROM users u
            JOIN roles r ON u.role_id = r.role_id
            JOIN user_statuses s ON u.status_id = s.status_id
            WHERE u.email = ?
        ");
        $stmt->execute([$data->email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC); // Ensure associative array

        if ($user && password_verify($data->password, $user['password_hash'])) {
            
            // Check if user has an active loan (for restriction logic)
            $stmtLoan = $pdo->prepare("
                SELECT COUNT(*) 
                FROM loans l
                JOIN loan_statuses ls ON l.status_id = ls.status_id
                WHERE l.student_id = ? AND ls.status_name IN ('approved', 'active', 'defaulted')
            ");
            $stmtLoan->execute([$user['id']]);
            $hasActiveLoan = $stmtLoan->fetchColumn() > 0;

            if ($user['status'] !== 'active' && $user['status'] !== 'restricted') {
                 // Allow 'banned' users to login ONLY if they have an active loan to repay
                 if ($user['status'] === 'banned' && $hasActiveLoan) {
                     // Bypass block, they must repay their loan
                 } else {
                     http_response_code(403);
                     echo json_encode(["message" => "Account is " . $user['status']]);
                     exit;
                 }
            }
            
            // Add 'restricted' flag
            $user['restricted'] = ($user['status'] === 'restricted') || ($user['status'] === 'banned' && $hasActiveLoan);

            // Successful Login - No 'last_login_at' column in strict schema yet, skipping update
            unset($user['password_hash']); // Don't send hash back
            
            http_response_code(200);
            echo json_encode([
                "message" => "Login successful",
                "user" => $user,
                "token" => base64_encode(json_encode([
                    'id' => $user['id'],
                    'role' => $user['role'],
                    'exp' => time() + (86400 * 7), // 7 days expiration
                    'sig' => md5($user['id'] . $user['role'] . 'SUPER_SECRET_UNIFUND_KEY') // Simple signature
                ]))
            ]);
        } else {
            http_response_code(401);
            echo json_encode(["message" => "Invalid email or password"]);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["message" => "Database error: " . $e->getMessage()]);
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "Incomplete data"]);
}
?>

<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once 'db_config.php';

try {
    // Query persistent fraud alerts from the database
    // We join with the users table to get the offender's details
    $sql = "
        SELECT 
            fa.alert_id,
            fa.alert_type,
            fa.severity,
            fa.description,
            fa.status as alert_status,
            fa.created_at as detected_at,
            u.user_id,
            u.full_name,
            u.email,
            u.role,
            u.avatar_url,
            u.status as user_status
        FROM fraud_alerts fa
        JOIN users u ON fa.user_id = u.user_id
        WHERE fa.is_active = TRUE
        ORDER BY fa.created_at DESC
        LIMIT 50
    ";

    $stmt = $pdo->query($sql);
    $alerts = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Transform data for frontend consistency
    $response = array_map(function($alert) {
        return [
            'id' => $alert['alert_id'],
            'activity' => $alert['description'],
            'severity' => ucfirst($alert['severity']), // e.g., 'high' -> 'High'
            'date' => date('Y-m-d', strtotime($alert['detected_at'])),
            'status' => $alert['alert_status'],
            'user' => [
                'id' => $alert['user_id'],
                'name' => $alert['full_name'],
                'email' => $alert['email'],
                'role' => $alert['role'],
                'avatar' => $alert['avatar_url'] ?? "https://api.dicebear.com/7.x/avataaars/svg?seed=" . urlencode($alert['full_name']),
                'status' => $alert['user_status']
            ]
        ];
    }, $alerts);

    echo json_encode($response);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Database error: " . $e->getMessage()]);
}
?>

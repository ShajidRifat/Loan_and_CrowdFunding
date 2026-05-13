<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once 'db_config.php';

$data = json_decode(file_get_contents("php://input"));

if (
    !empty($data->full_name) &&
    !empty($data->email) &&
    !empty($data->password) &&
    !empty($data->role)
) {
    try {
        // 1. Check if email exists
        $stmt = $pdo->prepare("SELECT user_id FROM users WHERE email = ?");
        $stmt->execute([$data->email]);
        if ($stmt->fetchColumn()) {
            http_response_code(409); // Conflict
            echo json_encode(["message" => "Email already exists"]);
            exit;
        }

        $pdo->beginTransaction();

        // 2. Resolve Role ID and Status ID
        $stmt = $pdo->prepare("SELECT role_id FROM roles WHERE role_name = ?");
        $stmt->execute([$data->role]);
        $role_id = $stmt->fetchColumn();

        if (!$role_id) {
             throw new Exception("Invalid role: " . $data->role);
        }

        $stmt = $pdo->prepare("SELECT status_id FROM user_statuses WHERE status_name = 'active'");
        $stmt->execute();
        $status_id = $stmt->fetchColumn();

        // 3. Create User
        $password_hash = password_hash($data->password, PASSWORD_BCRYPT);
        
        $stmt = $pdo->prepare("INSERT INTO users (full_name, email, password_hash, role_id, status_id) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([
            $data->full_name,
            $data->email,
            $password_hash,
            $role_id,
            $status_id
        ]);
        
        $user_id = $pdo->lastInsertId();

        // 4. Create Profile
        if ($data->role === 'student') {
            // Initialize with empty valid data for NOT NULL fields
            $stmt = $pdo->prepare("INSERT INTO student_profiles (user_id, university, student_id_number, major, enrollment_year, current_cgpa) VALUES (?, '', '', '', YEAR(CURRENT_DATE), 0.00)");
            $stmt->execute([$user_id]);
        } elseif ($data->role === 'donor') {
             // Fetch donor type ID (default to individual for now, or need input)
             $stmt = $pdo->prepare("SELECT donor_type_id FROM donor_types WHERE type_name = 'individual'");
             $stmt->execute();
             $donor_type_id = $stmt->fetchColumn();

            $stmt = $pdo->prepare("INSERT INTO donor_profiles (user_id, donor_type_id, organization_name) VALUES (?, ?, '')");
            $stmt->execute([$user_id, $donor_type_id]);
        }

        $pdo->commit();

        // 5. Fetch User to return full object
        $stmt = $pdo->prepare("
            SELECT u.user_id as id, u.full_name, u.email, r.role_name as role, s.status_name as status 
            FROM users u
            JOIN roles r ON u.role_id = r.role_id
            JOIN user_statuses s ON u.status_id = s.status_id
            WHERE u.user_id = ?
        ");
        $stmt->execute([$user_id]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        $token = bin2hex(random_bytes(16)); // Mock token

        http_response_code(201);
        echo json_encode([
            "message" => "User registered successfully",
            "user" => $user,
            "token" => $token
        ]);

    } catch (Exception $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        http_response_code(500);
        echo json_encode(["message" => "Error: " . $e->getMessage()]);
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "Incomplete data"]);
}
?>

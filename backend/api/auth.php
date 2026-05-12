<?php
require_once __DIR__ . '/../db_config.php';

function get_authenticated_user() {
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
    
    $authHeader = '';
    
    if (isset($_SERVER['Authorization'])) {
        $authHeader = trim($_SERVER["Authorization"]);
    } else if (isset($_SERVER['HTTP_AUTHORIZATION'])) { 
        $authHeader = trim($_SERVER["HTTP_AUTHORIZATION"]);
    } else if (function_exists('apache_request_headers')) {
        $requestHeaders = apache_request_headers();
        $requestHeaders = array_combine(array_map('ucwords', array_keys($requestHeaders)), array_values($requestHeaders));
        if (isset($requestHeaders['Authorization'])) {
            $authHeader = trim($requestHeaders['Authorization']);
        }
    }

    if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        $token = $matches[1];
        
        $decoded = base64_decode($token);
        if ($decoded) {
            $payload = json_decode($decoded, true);
            if ($payload && isset($payload['id'], $payload['role'], $payload['exp'], $payload['sig'])) {
                
                // Check expiration
                if (time() > $payload['exp']) {
                    http_response_code(401);
                    echo json_encode(["success" => false, "message" => "Token expired", "data" => null]);
                    exit;
                }
                
                // Verify signature
                $expectedSig = md5($payload['id'] . $payload['role'] . 'SUPER_SECRET_UNIFUND_KEY');
                if ($expectedSig !== $payload['sig']) {
                    http_response_code(401);
                    echo json_encode(["success" => false, "message" => "Invalid token signature", "data" => null]);
                    exit;
                }
                
                return $payload;
            }
        }
    }
    
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Unauthorized - Missing or invalid token", "data" => null]);
    exit;
}

function enforce_role($role) {
    $user = get_authenticated_user();
    if ($user['role'] !== $role) {
        http_response_code(403);
        echo json_encode(["success" => false, "message" => "Forbidden - Access restricted to " . $role . " only", "data" => null]);
        exit;
    }
    return $user;
}

function json_response($data, $message = "Success", $code = 200) {
    http_response_code($code);
    echo json_encode(["success" => $code >= 200 && $code < 300, "data" => $data, "message" => $message]);
    exit;
}
?>

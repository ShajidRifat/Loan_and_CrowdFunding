<?php
header("Content-Type: text/plain");
require_once 'db_config.php';

try {
    // Check if 'pending' exists
    $stmt = $pdo->prepare("SELECT status_id FROM campaign_statuses WHERE status_name = 'pending'");
    $stmt->execute();
    
    if ($stmt->fetch()) {
        echo "Status 'pending' already exists.\n";
    } else {
        // Insert 'pending'
        $stmt = $pdo->prepare("INSERT INTO campaign_statuses (status_name) VALUES ('pending')");
        $stmt->execute();
        echo "Status 'pending' added successfully. New ID: " . $pdo->lastInsertId() . "\n";
    }

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>

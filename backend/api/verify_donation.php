<?php
require_once __DIR__ . '/../api/db_config.php';

function test_donation($pdo) {
    try {
        echo "Starting Donation Verification Test...\n";

        // 1. Setup Test Data with Robust Cleanup
        $pdo->exec("SET FOREIGN_KEY_CHECKS=0");
        $email_list = "'test_donor@example.com', 'test_student@example.com'";
        
        // Clean Child Tables explicitly to avoid orphans
        $pdo->exec("DELETE FROM student_profiles WHERE user_id IN (SELECT user_id FROM users WHERE email IN ($email_list))");
        $pdo->exec("DELETE FROM donor_profiles WHERE user_id IN (SELECT user_id FROM users WHERE email IN ($email_list))");
        $pdo->exec("DELETE FROM campaigns WHERE student_id IN (SELECT user_id FROM users WHERE email IN ($email_list))");
        $pdo->exec("DELETE FROM transactions WHERE from_user_id IN (SELECT user_id FROM users WHERE email IN ($email_list)) OR to_user_id IN (SELECT user_id FROM users WHERE email IN ($email_list))");
        
        // Clean by Unique Keys (handling orphans from previous bad cleanup)
        $pdo->exec("DELETE FROM student_profiles WHERE student_id_number = 'T123'");
        $pdo->exec("DELETE FROM campaigns WHERE campaign_slug = 'test-slug'");

        // Finally delete users
        $pdo->exec("DELETE FROM users WHERE email IN ($email_list)");
        
        $pdo->exec("SET FOREIGN_KEY_CHECKS=1");
        
        // Create Student
        echo "Creating Test Student...\n";
        $pdo->exec("INSERT INTO users (email, password_hash, role, full_name) VALUES ('test_student@example.com', 'hash', 'student', 'Test Student')");
        $student_id = $pdo->lastInsertId();
        $pdo->exec("INSERT INTO student_profiles (user_id, university, major, student_id_number, enrollment_year, current_cgpa, wallet_balance) VALUES ($student_id, 'Test Uni', 'CS', 'T123', 2023, 3.50, 0.00)");

        // Create Donor
        echo "Creating Test Donor...\n";
        $pdo->exec("INSERT INTO users (email, password_hash, role, full_name) VALUES ('test_donor@example.com', 'hash', 'donor', 'Test Donor')");
        $donor_id = $pdo->lastInsertId();
        $pdo->exec("INSERT INTO donor_profiles (user_id, donor_type, total_donated) VALUES ($donor_id, 'individual', 0.00)");

        // Create Campaign
        echo "Creating Test Campaign...\n";
        $pdo->exec("INSERT INTO campaign_categories (category_name) VALUES ('Test Cat') ON DUPLICATE KEY UPDATE category_id=category_id");
        $stmt = $pdo->prepare("SELECT category_id FROM campaign_categories WHERE category_name = 'Test Cat'");
        $stmt->execute();
        $cat_id = $stmt->fetchColumn();

        $pdo->exec("INSERT INTO campaigns (campaign_slug, student_id, category_id, title, description, goal_amount, raised_amount, start_date, end_date, status, is_active) 
                   VALUES ('test-slug', $student_id, $cat_id, 'Test Campaign', 'Desc', 1000.00, 0.00, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), 'active', 1)");
        $campaign_id = $pdo->lastInsertId();

        // 2. Perform Donation via SP
        echo "Processing Donation of 500.00...\n";
        $stmt = $pdo->prepare("CALL sp_process_donation(?, ?, ?, ?, ?)");
        $stmt->execute([$campaign_id, $donor_id, 500.00, "Test Donation", 0]);

        // 3. Verify Results
        echo "Verifying Results...\n";

        // Check Campaign Raised Amount
        $stmt = $pdo->prepare("SELECT raised_amount FROM campaigns WHERE campaign_id = ?");
        $stmt->execute([$campaign_id]);
        $raised = $stmt->fetchColumn();
        echo "Campaign Raised: " . $raised . " (Expected: 500.00)\n";
        if ($raised != 500.00) throw new Exception("Campaign raised amount incorrect.");

        // Check Student Wallet
        $stmt = $pdo->prepare("SELECT wallet_balance FROM student_profiles WHERE user_id = ?");
        $stmt->execute([$student_id]);
        $balance = $stmt->fetchColumn();
        echo "Student Wallet: " . $balance . " (Expected: 500.00)\n";
        if ($balance != 500.00) throw new Exception("Student wallet balance incorrect.");

        // Check Donor Total Donated
        $stmt = $pdo->prepare("SELECT total_donated FROM donor_profiles WHERE user_id = ?");
        $stmt->execute([$donor_id]);
        $donated = $stmt->fetchColumn();
        echo "Donor Total: " . $donated . " (Expected: 500.00)\n";
        if ($donated != 500.00) throw new Exception("Donor total donated incorrect.");

        // Check Transaction Record
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM transactions WHERE campaign_id = ? AND transaction_type = 'donation'");
        $stmt->execute([$campaign_id]);
        $tx_count = $stmt->fetchColumn();
        echo "Transaction Count: " . $tx_count . " (Expected: 1)\n";
        if ($tx_count != 1) throw new Exception("Transaction record missing.");

        echo "SUCCESS: Donation logic verified!\n";

        // Final Cleanup (Repeat explicit cleanup)
        $pdo->exec("SET FOREIGN_KEY_CHECKS=0");
        $pdo->exec("DELETE FROM student_profiles WHERE user_id IN (SELECT user_id FROM users WHERE email IN ($email_list))");
        $pdo->exec("DELETE FROM donor_profiles WHERE user_id IN (SELECT user_id FROM users WHERE email IN ($email_list))");
        $pdo->exec("DELETE FROM campaigns WHERE student_id IN (SELECT user_id FROM users WHERE email IN ($email_list))");
        $pdo->exec("DELETE FROM transactions WHERE from_user_id IN (SELECT user_id FROM users WHERE email IN ($email_list)) OR to_user_id IN (SELECT user_id FROM users WHERE email IN ($email_list))");
        $pdo->exec("DELETE FROM users WHERE email IN ($email_list)");
        $pdo->exec("SET FOREIGN_KEY_CHECKS=1");
        
    } catch (Exception $e) {
        echo "FAILURE: " . $e->getMessage() . "\n";
        exit(1);
    }
}

test_donation($pdo);
?>

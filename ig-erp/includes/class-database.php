<?php
namespace IG_ERP;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Database {
    public static function create_tables() {
        global $wpdb;
        $charset_collate = $wpdb->get_charset_collate();

        require_once ABSPATH . 'wp-admin/includes/upgrade.php';

        // Attendance Table
        $sql_attendance = "CREATE TABLE {$wpdb->prefix}ig_attendance (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            employee_id bigint(20) NOT NULL,
            check_in datetime DEFAULT '0000-00-00 00:00:00' NOT NULL,
            check_out datetime DEFAULT NULL,
            in_lat varchar(50) DEFAULT '' NOT NULL,
            in_lng varchar(50) DEFAULT '' NOT NULL,
            in_accuracy float DEFAULT NULL,
            out_lat varchar(50) DEFAULT NULL,
            out_lng varchar(50) DEFAULT NULL,
            out_accuracy float DEFAULT NULL,
            device_id varchar(100) DEFAULT '' NOT NULL,
            status varchar(20) DEFAULT 'present' NOT NULL,
            PRIMARY KEY (id)
        ) $charset_collate;";

        dbDelta( $sql_attendance );

        // Employees Table
        $sql_employees = "CREATE TABLE {$wpdb->prefix}ig_employees (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            user_id bigint(20) NOT NULL,
            employee_no varchar(50) NOT NULL,
            shift_id bigint(20) DEFAULT NULL,
            department varchar(100) DEFAULT '',
            position varchar(100) DEFAULT '',
            phone varchar(20) DEFAULT '',
            status varchar(20) DEFAULT 'active',
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY user_id (user_id)
        ) $charset_collate;";

        dbDelta( $sql_employees );

        // Shifts Table
        $sql_shifts = "CREATE TABLE {$wpdb->prefix}ig_shifts (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            name varchar(100) NOT NULL,
            start_time time NOT NULL,
            end_time time NOT NULL,
            grace_period int(11) DEFAULT 0,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id)
        ) $charset_collate;";

        dbDelta( $sql_shifts );

        // Fraud Alerts Table
        $sql_fraud = "CREATE TABLE {$wpdb->prefix}ig_fraud_alerts (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            record_id bigint(20) NOT NULL,
            employee_id bigint(20) NOT NULL,
            risk_score int(3) NOT NULL,
            reason text NOT NULL,
            detected_patterns text NOT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id)
        ) $charset_collate;";

        dbDelta( $sql_fraud );

        // Locations Telemetry Table
        $sql_locations = "CREATE TABLE {$wpdb->prefix}ig_locations (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            employee_id bigint(20) NOT NULL,
            lat varchar(50) NOT NULL,
            lng varchar(50) NOT NULL,
            accuracy varchar(50) DEFAULT '',
            is_mocked tinyint(1) DEFAULT 0,
            timestamp datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id)
        ) $charset_collate;";

        dbDelta( $sql_locations );
    }
}

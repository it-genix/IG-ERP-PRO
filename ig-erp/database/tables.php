<?php
namespace IG_ERP\Database;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Tables {
    public static function create_tables() {
        global $wpdb;
        $charset_collate = $wpdb->get_charset_collate();

        require_once ABSPATH . 'wp-admin/includes/upgrade.php';

        // Employees Table
        $sql_employees = "CREATE TABLE {$wpdb->prefix}ig_employees (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            user_id bigint(20) NOT NULL,
            employee_no varchar(50),
            shift_id bigint(20),
            phone varchar(20),
            department varchar(100),
            position varchar(100),
            salary decimal(10,2),
            hire_date date,
            status varchar(20) DEFAULT 'active',
            PRIMARY KEY (id),
            UNIQUE KEY user_id (user_id)
        ) $charset_collate;";

        // Attendance Table
        $sql_attendance = "CREATE TABLE {$wpdb->prefix}ig_attendance (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            employee_id bigint(20) NOT NULL,
            check_in datetime NOT NULL,
            check_out datetime,
            in_lat varchar(50),
            in_lng varchar(50),
            out_lat varchar(50),
            out_lng varchar(50),
            device_id varchar(255),
            status varchar(20) DEFAULT 'present',
            PRIMARY KEY (id)
        ) $charset_collate;";

        // Locations History Table
        $sql_locations = "CREATE TABLE {$wpdb->prefix}ig_locations (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            employee_id bigint(20) NOT NULL,
            lat varchar(50) NOT NULL,
            lng varchar(50) NOT NULL,
            timestamp datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id)
        ) $charset_collate;";

        // Leaves Table
        $sql_leaves = "CREATE TABLE {$wpdb->prefix}ig_leaves (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            employee_id bigint(20) NOT NULL,
            leave_type varchar(50) NOT NULL,
            start_date date NOT NULL,
            end_date date NOT NULL,
            reason text,
            status varchar(20) DEFAULT 'pending',
            approved_by bigint(20),
            PRIMARY KEY (id)
        ) $charset_collate;";

        // Leave Types Table
        $sql_leave_types = "CREATE TABLE {$wpdb->prefix}ig_leave_types (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            name varchar(100) NOT NULL,
            description text,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id)
        ) $charset_collate;";

        // Tracking Logs
        $sql_tracking_logs = "CREATE TABLE {$wpdb->prefix}ig_tracking_logs (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            employee_id bigint(20) NOT NULL,
            event_type varchar(50) NOT NULL,
            details text,
            timestamp datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id)
        ) $charset_collate;";

        dbDelta( $sql_employees );
        dbDelta( $sql_attendance );
        dbDelta( $sql_locations );
        dbDelta( $sql_leaves );
        dbDelta( $sql_leave_types );
        dbDelta( $sql_tracking_logs );
    }
}

<?php
namespace IG_ERP;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Analytics {
    private static $instance = null;

    public static function get_instance() {
        if ( null === self::$instance ) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {}

    public function get_dashboard_stats() {
        global $wpdb;

        $total_employees = $wpdb->get_var( "SELECT COUNT(*) FROM {$wpdb->prefix}ig_employees" );
        $present_today = $wpdb->get_var( $wpdb->prepare(
            "SELECT COUNT(DISTINCT employee_id) FROM {$wpdb->prefix}ig_attendance WHERE DATE(check_in) = %s",
            current_time( 'Y-m-d' )
        ) );

        return array(
            'total_employees' => $total_employees,
            'present_today'   => $present_today,
            'attendance_rate' => $total_employees > 0 ? ( $present_today / $total_employees ) * 100 : 0
        );
    }
}

<?php
namespace IG_ERP;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Tracking {
    private static $instance = null;

    public static function get_instance() {
        if ( null === self::$instance ) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {}

    public function log_event( $employee_id, $event_type, $details = '' ) {
        global $wpdb;
        return $wpdb->insert(
            "{$wpdb->prefix}ig_tracking_logs",
            array(
                'employee_id' => $employee_id,
                'event_type'  => $event_type,
                'details'     => is_array( $details ) ? json_encode( $details ) : $details,
                'timestamp'   => current_time( 'mysql' )
            )
        );
    }
}

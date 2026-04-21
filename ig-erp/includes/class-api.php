<?php
namespace IG_ERP;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class API {
    private static $instance = null;

    public static function get_instance() {
        if ( null === self::$instance ) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        add_action( 'rest_api_init', array( $this, 'register_routes' ) );
    }

    public function register_routes() {
        register_rest_route( 'ig-erp/v1', '/attendance/checkin', array(
            'methods'  => 'POST',
            'callback' => array( $this, 'checkin' ),
            'permission_callback' => array( $this, 'check_auth' )
        ) );

        register_rest_route( 'ig-erp/v1', '/attendance/checkout', array(
            'methods'  => 'POST',
            'callback' => array( $this, 'checkout' ),
            'permission_callback' => array( $this, 'check_auth' )
        ) );

        register_rest_route( 'ig-erp/v1', '/attendance', array(
            'methods'  => 'GET',
            'callback' => array( $this, 'get_attendance' ),
            'permission_callback' => array( $this, 'check_admin_auth' )
        ) );

        register_rest_route( 'ig-erp/v1', '/telemetry', array(
            'methods'  => 'POST',
            'callback' => array( $this, 'save_telemetry' ),
            'permission_callback' => array( $this, 'check_auth' )
        ) );
    }

    public function check_auth() {
        return is_user_logged_in();
    }

    public function check_admin_auth() {
        return current_user_can( 'manage_options' );
    }

    public function save_telemetry( $request ) {
        $params = $request->get_params();
        global $wpdb;
        
        $wpdb->insert(
            "{$wpdb->prefix}ig_locations",
            array(
                'employee_id' => get_current_user_id(),
                'lat'         => sanitize_text_field( $params['lat'] ),
                'lng'         => sanitize_text_field( $params['lng'] ),
                'accuracy'    => sanitize_text_field( $params['accuracy'] ?? '' ),
                'is_mocked'   => !empty( $params['is_mocked'] ) ? 1 : 0,
            )
        );

        return new \WP_REST_Response( array( 'status' => 'recorded' ), 200 );
    }

    public function get_attendance() {
        global $wpdb;
        $records = $wpdb->get_results( "SELECT a.*, u.display_name as employee_name FROM {$wpdb->prefix}ig_attendance a JOIN {$wpdb->users} u ON a.employee_id = u.ID ORDER BY a.check_in DESC LIMIT 100" );
        return new \WP_REST_Response( $records, 200 );
    }

    public function checkin( $request ) {
        // Implementation logic calls Attendance class
        return new \WP_REST_Response( array( 'status' => 'success' ), 200 );
    }

    public function checkout( $request ) {
        return new \WP_REST_Response( array( 'status' => 'success' ), 200 );
    }
}

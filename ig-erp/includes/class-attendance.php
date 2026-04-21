<?php
namespace IG_ERP;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Attendance {
    private static $instance = null;

    public static function get_instance() {
        if ( null === self::$instance ) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        add_action( 'wp_ajax_ig_erp_check_in', array( $this, 'ajax_check_in' ) );
        add_action( 'wp_ajax_ig_erp_check_out', array( $this, 'ajax_check_out' ) );
    }

    public function ajax_check_in() {
        check_ajax_referer( 'ig_erp_nonce', 'nonce' );

        $lat = isset( $_POST['lat'] ) ? (float) $_POST['lat'] : 0;
        $lng = isset( $_POST['lng'] ) ? (float) $_POST['lng'] : 0;
        $accuracy = isset( $_POST['accuracy'] ) ? (float) $_POST['accuracy'] : null;
        $is_mocked = isset( $_POST['is_mocked'] ) && $_POST['is_mocked'] === 'true';
        $device_id = isset( $_POST['device_id'] ) ? sanitize_text_field( $_POST['device_id'] ) : 'unknown';
        $user_id   = get_current_user_id();

        global $wpdb;

        // Get actual employee record ID from wp_ig_employees
        $employee = $wpdb->get_row( $wpdb->prepare(
            "SELECT e.id, e.shift_id, s.start_time, s.grace_period 
             FROM {$wpdb->prefix}ig_employees e
             LEFT JOIN {$wpdb->prefix}ig_shifts s ON e.shift_id = s.id
             WHERE e.user_id = %d",
            $user_id
        ) );

        if ( ! $employee ) {
            wp_send_json_error( 'Employee record not found. Please contact administration.' );
        }

        $employee_id = $employee->id;
        
        // Anti Fake GPS detection
        if ( $is_mocked ) {
            wp_send_json_error( 'Suspicious activity detected. Fake GPS providers are not allowed.' );
        }
        
        // --- Shift Logic (Late Detection) ---
        $status = 'present';
        if ( ! empty( $employee->start_time ) ) {
            $now_time = current_time( 'H:i:s' );
            $shift_start_ts = strtotime( $employee->start_time );
            $grace_ts = $shift_start_ts + ( intval( $employee->grace_period ) * 60 );
            $now_ts   = strtotime( $now_time );

            if ( $now_ts > $grace_ts ) {
                $status = 'late';
            }
        }

        // Apply low accuracy status if needed (late takes precedence if we want, but let's keep accuracy as a critical flag)
        if ( ! is_null( $accuracy ) && $accuracy > 100 ) {
            $status = 'low_accuracy';
        }

        // 1. Prevent multiple check-ins on the SAME day
        $today = current_time( 'Y-m-d' );
        $exists = $wpdb->get_var( $wpdb->prepare(
            "SELECT id FROM {$wpdb->prefix}ig_attendance WHERE employee_id = %d AND DATE(check_in) = %s",
            $employee_id, $today
        ) );

        if ( $exists ) {
            wp_send_json_error( 'You have already checked in for today.' );
        }

        // 2. Geofencing check
        $office_lat   = (float) ig_erp_get_option( 'office_lat', '34.0522' );
        $office_lng   = (float) ig_erp_get_option( 'office_lng', '-118.2437' );
        $radius       = (int) ig_erp_get_option( 'geofence_radius', 200 ); // meters
        // $gmaps_key = ig_erp_get_option( 'google_maps_key', '' ); // For future map integrations

        if ( empty( $lat ) || empty( $lng ) ) {
            wp_send_json_error( 'GPS coordinates are required for check-in.' );
        }

        $distance = $this->calculate_distance( $lat, $lng, $office_lat, $office_lng );

        if ( $distance > $radius ) {
            wp_send_json_error( sprintf( 'Outside geofence area. You are %d meters away from the office.', round( $distance ) ) );
        }

        $wpdb->insert(
            "{$wpdb->prefix}ig_attendance",
            array(
                'employee_id' => $employee_id,
                'check_in'    => current_time( 'mysql' ),
                'in_lat'      => $lat,
                'in_lng'      => $lng,
                'in_accuracy' => $accuracy,
                'device_id'   => $device_id,
                'status'      => $status
            )
        );

        wp_send_json_success( 'Checked in successfully within office geofence.' );
    }

    /**
     * Calculate distance between two GPS coordinates in meters using Haversine formula
     */
    private function calculate_distance( $lat1, $lon1, $lat2, $lon2 ) {
        $earth_radius = 6371000;
        
        $dLat = deg2rad( $lat2 - $lat1 );
        $dLon = deg2rad( $lon2 - $lon1 );
        
        $a = sin( $dLat / 2 ) * sin( $dLat / 2 ) +
             cos( deg2rad( $lat1 ) ) * cos( deg2rad( $lat2 ) ) *
             sin( $dLon / 2 ) * sin( $dLon / 2 );
             
        $c = 2 * atan2( sqrt( $a ), sqrt( 1 - $a ) );
        
        return $earth_radius * $c;
    }

    public function ajax_check_out() {
        check_ajax_referer( 'ig_erp_nonce', 'nonce' );

        $lat = sanitize_text_field( $_POST['lat'] );
        $lng = sanitize_text_field( $_POST['lng'] );
        $accuracy = isset( $_POST['accuracy'] ) ? (float) $_POST['accuracy'] : null;
        $user_id = get_current_user_id();

        global $wpdb;

        // Get actual employee record ID from wp_ig_employees
        $employee_id = $wpdb->get_var( $wpdb->prepare(
            "SELECT id FROM {$wpdb->prefix}ig_employees WHERE user_id = %d",
            $user_id
        ) );

        if ( ! $employee_id ) {
            wp_send_json_error( 'Employee record not found.' );
        }

        $record_id = $wpdb->get_var( $wpdb->prepare(
            "SELECT id FROM {$wpdb->prefix}ig_attendance WHERE employee_id = %d AND check_out IS NULL ORDER BY check_in DESC LIMIT 1",
            $employee_id
        ) );

        if ( ! $record_id ) {
            wp_send_json_error( 'No active check-in found' );
        }

        $wpdb->update(
            "{$wpdb->prefix}ig_attendance",
            array(
                'check_out'    => current_time( 'mysql' ),
                'out_lat'      => $lat,
                'out_lng'      => $lng,
                'out_accuracy' => $accuracy
            ),
            array( 'id' => $record_id )
        );

        wp_send_json_success( 'Checked out successfully' );
    }
}

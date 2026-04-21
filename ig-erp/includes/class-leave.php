<?php
namespace IG_ERP;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Leave {
    private static $instance = null;

    public static function get_instance() {
        if ( null === self::$instance ) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        add_action( 'wp_ajax_ig_erp_submit_leave', array( $this, 'ajax_submit_leave' ) );
        add_action( 'wp_ajax_ig_erp_update_leave_status', array( $this, 'ajax_update_leave_status' ) );
        add_action( 'wp_ajax_ig_erp_get_self_leaves', array( $this, 'ajax_get_self_leaves' ) );
        add_action( 'wp_ajax_ig_erp_get_team_availability', array( $this, 'ajax_get_team_availability' ) );
        add_action( 'wp_ajax_ig_erp_get_team_availability_nopriv', array( $this, 'ajax_get_team_availability' ) );
        add_action( 'wp_ajax_ig_erp_add_leave_type', array( $this, 'ajax_add_leave_type' ) );
        add_action( 'wp_ajax_ig_erp_get_leave_types', array( $this, 'ajax_get_leave_types' ) );
        add_action( 'wp_ajax_ig_erp_delete_leave_type', array( $this, 'ajax_delete_leave_type' ) );
    }

    public function ajax_get_team_availability() {
        check_ajax_referer( 'ig_erp_nonce', 'nonce' );
        if ( ! is_user_logged_in() ) {
            wp_send_json_error( 'Unauthorized' );
        }

        global $wpdb;
        $today = date( 'Y-m-d' );

        $on_leave = $wpdb->get_results( $wpdb->prepare(
            "SELECT u.display_name, l.leave_type, l.start_date, l.end_date 
             FROM {$wpdb->prefix}ig_leaves l
             JOIN {$wpdb->prefix}ig_employees e ON l.employee_id = e.id
             JOIN {$wpdb->users} u ON e.user_id = u.ID
             WHERE l.status = 'approved' AND %s BETWEEN l.start_date AND l.end_date",
            $today
        ) );

        wp_send_json_success( $on_leave );
    }

    public function ajax_get_self_leaves() {
        check_ajax_referer( 'ig_erp_nonce', 'nonce' );
        if ( ! is_user_logged_in() ) {
            wp_send_json_error( 'Unauthorized' );
        }

        $user_id = get_current_user_id();
        global $wpdb;

        $employee_id = $wpdb->get_var( $wpdb->prepare(
            "SELECT id FROM {$wpdb->prefix}ig_employees WHERE user_id = %d",
            $user_id
        ) );

        if ( !$employee_id ) {
            wp_send_json_error( 'Employee record not found.' );
        }

        // If manager, get all pending leaves + own leaves
        if ( current_user_can( 'manage_options' ) ) {
            $leaves = $wpdb->get_results( $wpdb->prepare(
                "SELECT l.*, u.display_name as user_name 
                 FROM {$wpdb->prefix}ig_leaves l
                 JOIN {$wpdb->prefix}ig_employees e ON l.employee_id = e.id
                 JOIN {$wpdb->users} u ON e.user_id = u.ID
                 WHERE l.employee_id = %d OR l.status = 'pending'
                 ORDER BY (l.status = 'pending') DESC, l.id DESC",
                $employee_id
            ) );
        } else {
            $leaves = $wpdb->get_results( $wpdb->prepare(
                "SELECT * FROM {$wpdb->prefix}ig_leaves WHERE employee_id = %d ORDER BY id DESC",
                $employee_id
            ) );
        }

        wp_send_json_success( $leaves );
    }

    public function ajax_update_leave_status() {
        check_ajax_referer( 'ig_erp_nonce', 'nonce' );
        if ( ! current_user_can( 'manage_options' ) ) {
            wp_send_json_error( 'Unauthorized' );
        }

        $id = intval( $_POST['id'] );
        $status = sanitize_text_field( $_POST['status'] );
        $user_id = get_current_user_id();

        if ( ! in_array( $status, array( 'approved', 'rejected' ) ) ) {
            wp_send_json_error( 'Invalid status' );
        }

        global $wpdb;
        $wpdb->update(
            "{$wpdb->prefix}ig_leaves",
            array( 
                'status' => $status,
                'approved_by' => $user_id
            ),
            array( 'id' => $id )
        );

        // 🔔 Notification Trigger
        do_action( 'ig_erp_leave_status_updated', $id, $status );

        // 📅 Calendar Sync Trigger
        if ( $status === 'approved' ) {
            $calendar = Calendar::get_instance();
            if ( $calendar->is_connected() ) {
                $calendar->add_leave_to_calendar( $id );
            }
        }

        wp_send_json_success( 'Leave request ' . $status );
    }

    public function ajax_submit_leave() {
        check_ajax_referer( 'ig_erp_nonce', 'nonce' );
        $user_id = get_current_user_id();

        global $wpdb;
        $employee_id = $wpdb->get_var( $wpdb->prepare(
            "SELECT id FROM {$wpdb->prefix}ig_employees WHERE user_id = %d",
            $user_id
        ) );

        if ( !$employee_id ) {
            wp_send_json_error( 'Employee record not found.' );
        }

        $data = array(
            'employee_id' => $employee_id,
            'leave_type'  => sanitize_text_field( $_POST['leave_type'] ),
            'start_date'  => sanitize_text_field( $_POST['start_date'] ),
            'end_date'    => sanitize_text_field( $_POST['end_date'] ),
            'reason'      => sanitize_textarea_field( $_POST['reason'] ),
            'status'      => 'pending'
        );

        global $wpdb;
        $wpdb->insert( "{$wpdb->prefix}ig_leaves", $data );

        wp_send_json_success( 'Leave request submitted' );
    }

    public function ajax_add_leave_type() {
        check_ajax_referer( 'ig_erp_nonce', 'nonce' );
        if ( ! current_user_can( 'manage_options' ) && ! current_user_can( 'edit_users' ) ) {
            wp_send_json_error( 'Unauthorized' );
        }

        $name = sanitize_text_field( $_POST['name'] ?? '' );
        $description = sanitize_textarea_field( $_POST['description'] ?? '' );

        if ( empty( $name ) ) {
            wp_send_json_error( 'Name is required' );
        }

        global $wpdb;
        $wpdb->insert( "{$wpdb->prefix}ig_leave_types", array(
            'name' => $name,
            'description' => $description
        ) );

        wp_send_json_success( 'Leave type added successfully' );
    }

    public function ajax_get_leave_types() {
        check_ajax_referer( 'ig_erp_nonce', 'nonce' );
        // Allowed for all logged in users so they can request leaves
        if ( ! is_user_logged_in() ) {
            wp_send_json_error( 'Unauthorized' );
        }

        global $wpdb;
        $types = $wpdb->get_results( "SELECT * FROM {$wpdb->prefix}ig_leave_types ORDER BY name ASC" );

        wp_send_json_success( $types );
    }

    public function ajax_delete_leave_type() {
        check_ajax_referer( 'ig_erp_nonce', 'nonce' );
        if ( ! current_user_can( 'manage_options' ) && ! current_user_can( 'edit_users' ) ) {
            wp_send_json_error( 'Unauthorized' );
        }

        $id = intval( $_POST['id'] ?? 0 );

        if ( empty( $id ) ) {
            wp_send_json_error( 'ID is required' );
        }

        global $wpdb;
        $wpdb->delete( "{$wpdb->prefix}ig_leave_types", array( 'id' => $id ) );

        wp_send_json_success( 'Leave type deleted successfully' );
    }
}

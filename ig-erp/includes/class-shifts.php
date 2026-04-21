<?php
namespace IG_ERP;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Shifts {
    private static $instance = null;

    public static function get_instance() {
        if ( null === self::$instance ) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        add_action( 'wp_ajax_ig_erp_save_shift', array( $this, 'ajax_save_shift' ) );
        add_action( 'wp_ajax_ig_erp_delete_shift', array( $this, 'ajax_delete_shift' ) );
    }

    public function get_shifts() {
        global $wpdb;
        return $wpdb->get_results( 
            "SELECT s.*, (SELECT COUNT(*) FROM {$wpdb->prefix}ig_employees WHERE shift_id = s.id) as employee_count 
             FROM {$wpdb->prefix}ig_shifts s 
             ORDER BY name ASC" 
        );
    }

    public function ajax_save_shift() {
        check_ajax_referer( 'ig_erp_nonce', 'nonce' );
        if ( ! current_user_can( 'manage_options' ) ) {
            wp_send_json_error( 'Unauthorized' );
        }

        global $wpdb;
        $id = isset( $_POST['id'] ) ? intval( $_POST['id'] ) : 0;
        $data = array(
            'name'         => sanitize_text_field( $_POST['name'] ),
            'start_time'   => sanitize_text_field( $_POST['start_time'] ),
            'end_time'     => sanitize_text_field( $_POST['end_time'] ),
            'grace_period' => intval( $_POST['grace_period'] ),
        );

        if ( $id ) {
            $wpdb->update( "{$wpdb->prefix}ig_shifts", $data, array( 'id' => $id ) );
            wp_send_json_success( 'Shift updated successfully.' );
        } else {
            $wpdb->insert( "{$wpdb->prefix}ig_shifts", $data );
            wp_send_json_success( 'Shift created successfully.' );
        }
    }

    public function ajax_delete_shift() {
        check_ajax_referer( 'ig_erp_nonce', 'nonce' );
        if ( ! current_user_can( 'manage_options' ) ) {
            wp_send_json_error( 'Unauthorized' );
        }

        global $wpdb;
        $id = intval( $_POST['id'] );
        $wpdb->delete( "{$wpdb->prefix}ig_shifts", array( 'id' => $id ) );
        wp_send_json_success( 'Shift deleted successfully.' );
    }
}

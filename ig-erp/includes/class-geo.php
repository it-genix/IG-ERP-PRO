<?php
namespace IG_ERP;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Geo {
    private static $instance = null;

    public static function get_instance() {
        if ( null === self::$instance ) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        add_action( 'wp_ajax_ig_erp_save_location', array( $this, 'ajax_save_location' ) );
    }

    public function ajax_save_location() {
        check_ajax_referer( 'ig_erp_nonce', 'nonce' );

        $lat = sanitize_text_field( $_POST['lat'] );
        $lng = sanitize_text_field( $_POST['lng'] );
        $employee_id = get_current_user_id();

        global $wpdb;
        $wpdb->insert(
            "{$wpdb->prefix}ig_locations",
            array(
                'employee_id' => $employee_id,
                'lat'         => $lat,
                'lng'         => $lng,
                'timestamp'   => current_time( 'mysql' )
            )
        );

        wp_send_json_success();
    }
}

<?php
namespace IG_ERP;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Core Plugin Class
 */
class Core {
    private static $instance = null;

    public static function get_instance() {
        if ( null === self::$instance ) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        $this->init_components();
        $this->init_admin();
        $this->init_api();

        add_action( 'admin_init', array( 'IG_ERP\\Database\\Tables', 'create_tables' ) );
        add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_assets' ) );
    }

    public function enqueue_admin_assets() {
        wp_enqueue_style( 'ig-erp-admin-style', IG_ERP_URL . 'admin/assets/admin.css', array(), IG_ERP_VERSION );
        wp_enqueue_script( 'ig-erp-admin-script', IG_ERP_URL . 'admin/assets/admin.js', array( 'jquery' ), IG_ERP_VERSION, true );

        wp_localize_script( 'ig-erp-admin-script', 'ig_erp', array(
            'ajax_url' => admin_url( 'admin-ajax.php' ),
            'nonce'    => wp_create_nonce( 'ig_erp_nonce' )
        ) );
    }

    private function init_components() {
        // Initialize functional modules
        Employees::get_instance();
        Shifts::get_instance();
        Attendance::get_instance();
        Leave::get_instance();
        Calendar::get_instance();
        Tracking::get_instance();
        Analytics::get_instance();
        Geo::get_instance();
    }

    private function init_admin() {
        if ( is_admin() ) {
            require_once IG_ERP_PATH . 'admin/menu.php';
        }
    }

    private function init_api() {
        API::get_instance();
    }
}

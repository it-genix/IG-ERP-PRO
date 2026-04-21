<?php
/**
 * Plugin Name: IG-ERP
 * Plugin URI: https://example.com/ig-erp
 * Description: A professional enterprise-level WordPress ERP plugin for employee management, attendance tracking, and geo-tracking.
 * Version: 1.0.0
 * Author: IG-Tech
 * Author URI: https://example.com
 * License: GPL2
 * Text Domain: ig-erp
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly.
}

// Define Constants
define( 'IG_ERP_VERSION', '1.0.0' );
define( 'IG_ERP_PATH', plugin_dir_path( __FILE__ ) );
define( 'IG_ERP_URL', plugin_dir_url( __FILE__ ) );

/**
 * Autoload Classes
 */
spl_autoload_register( function ( $class ) {
    $prefix = 'IG_ERP\\';
    $base_dir = IG_ERP_PATH . 'includes/';

    $len = strlen( $prefix );
    if ( strncmp( $prefix, $class, $len ) !== 0 ) {
        return;
    }

    $relative_class = substr( $class, $len );
    $file = $base_dir . 'class-' . strtolower( str_replace( '_', '-', $relative_class ) ) . '.php';

    if ( file_exists( $file ) ) {
        require $file;
    }
} );

/**
 * Initialize Plugin
 */
function ig_erp_init() {
    // Activation hook
    register_activation_hook( __FILE__, array( 'IG_ERP\\Database\\Tables', 'create_tables' ) );
    
    // Core initialization
    \IG_ERP\Core::get_instance();
}

add_action( 'plugins_loaded', 'ig_erp_init' );

// Include helper functions
require_once IG_ERP_PATH . 'function.php';

<?php
/**
 * Helper functions for IG-ERP
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Get IG-ERP setting
 */
function ig_erp_get_option( $option, $default = '' ) {
    $options = get_option( 'ig_erp_settings', [] );
    return isset( $options[ $option ] ) ? $options[ $option ] : $default;
}

/**
 * Format GPS coordinates
 */
function ig_erp_format_coords( $lat, $lng ) {
    return sprintf( 'Lat: %s, Lng: %s', esc_html( $lat ), esc_html( $lng ) );
}

/**
 * Check if user is IG-ERP Admin
 */
function ig_erp_is_admin( $user_id = null ) {
    if ( ! $user_id ) {
        $user_id = get_current_user_id();
    }
    return user_can( $user_id, 'manage_options' ) || user_can( $user_id, 'ig_erp_admin' );
}

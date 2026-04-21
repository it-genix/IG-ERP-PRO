<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

add_action( 'admin_menu', 'ig_erp_add_admin_menu' );

function ig_erp_add_admin_menu() {
    add_menu_page(
        'IG-ERP',
        'IG-ERP',
        'manage_options',
        'ig-erp',
        'ig_erp_admin_dashboard',
        'dashicons-groups',
        30
    );

    add_submenu_page(
        'ig-erp',
        'Employees',
        'Employees',
        'manage_options',
        'ig-erp-employees',
        'ig_erp_admin_employees'
    );

    add_submenu_page(
        'ig-erp',
        'Attendance Shifts',
        'Attendance Shifts',
        'manage_options',
        'ig-erp-shifts',
        'ig_erp_admin_shifts'
    );

    add_submenu_page(
        'ig-erp',
        'Live Tracking',
        'Live Tracking',
        'manage_options',
        'ig-erp-tracking',
        'ig_erp_admin_tracking'
    );

    add_submenu_page(
        'ig-erp',
        'Leaves',
        'Leaves',
        'manage_options',
        'ig-erp-leaves',
        'ig_erp_admin_leaves'
    );

    add_submenu_page(
        'ig-erp',
        'Settings',
        'Settings',
        'manage_options',
        'ig-erp-settings',
        'ig_erp_admin_settings'
    );
}

function ig_erp_admin_dashboard() {
    include IG_ERP_PATH . 'admin/dashboard.php';
}

function ig_erp_admin_employees() {
    include IG_ERP_PATH . 'admin/employees.php';
}

function ig_erp_admin_shifts() {
    include IG_ERP_PATH . 'admin/shifts.php';
}

function ig_erp_admin_tracking() {
    include IG_ERP_PATH . 'admin/tracking.php';
}

function ig_erp_admin_leaves() {
    include IG_ERP_PATH . 'admin/leaves.php';
}

function ig_erp_admin_settings() {
    include IG_ERP_PATH . 'admin/settings.php';
}

<?php
namespace IG_ERP;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Employees {
    private static $instance = null;

    public static function get_instance() {
        if ( null === self::$instance ) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        add_action( 'wp_ajax_ig_erp_get_all_employees', array( $this, 'ajax_get_all_employees' ) );
        add_action( 'wp_ajax_ig_erp_save_employee', array( $this, 'ajax_save_employee' ) );
        add_action( 'wp_ajax_ig_erp_get_employee', array( $this, 'ajax_get_employee' ) );
        add_action( 'wp_ajax_ig_erp_delete_employee', array( $this, 'ajax_delete_employee' ) );
        add_action( 'wp_ajax_ig_erp_get_employee_profile', array( $this, 'ajax_get_employee_profile' ) );
        add_action( 'wp_ajax_ig_erp_update_self_profile', array( $this, 'ajax_update_self_profile' ) );
        add_action( 'wp_ajax_ig_erp_get_self_profile', array( $this, 'ajax_get_self_profile' ) );
        add_action( 'wp_ajax_ig_erp_bulk_action_employees', array( $this, 'ajax_bulk_action_employees' ) );
    }

    public function ajax_get_all_employees() {
        check_ajax_referer( 'ig_erp_nonce', 'nonce' );
        if ( ! current_user_can( 'manage_options' ) && ! current_user_can( 'edit_users' ) ) {
            wp_send_json_error( 'Unauthorized' );
        }

        $employees = $this->get_all_employees();
        
        // Also get shifts for the dropdown
        global $wpdb;
        $shifts = $wpdb->get_results("SELECT id, name FROM {$wpdb->prefix}ig_shifts");

        // And get users who are not yet employees if needed, 
        // but for now let's just return all users so we can "Add" them
        $users = get_users(array('fields' => array('ID', 'display_name', 'user_email')));

        wp_send_json_success( array(
            'employees' => $employees,
            'shifts'    => $shifts,
            'users'     => $users
        ) );
    }

    public function get_all_employees() {
        global $wpdb;
        return $wpdb->get_results(
            "SELECT e.*, u.display_name, u.user_email, s.name as shift_name 
             FROM {$wpdb->prefix}ig_employees e 
             JOIN {$wpdb->users} u ON e.user_id = u.ID 
             LEFT JOIN {$wpdb->prefix}ig_shifts s ON e.shift_id = s.id
             ORDER BY e.id DESC"
        );
    }

    public function ajax_save_employee() {
        check_ajax_referer( 'ig_erp_nonce', 'nonce' );
        if ( ! current_user_can( 'manage_options' ) && ! current_user_can( 'edit_users' ) ) {
            wp_send_json_error( 'Unauthorized' );
        }

        $data = array(
            'user_id'     => intval( $_POST['user_id'] ),
            'employee_no' => sanitize_text_field( $_POST['employee_no'] ),
            'shift_id'    => !empty($_POST['shift_id']) ? intval($_POST['shift_id']) : null,
            'department'  => sanitize_text_field( $_POST['department'] ),
            'position'    => sanitize_text_field( $_POST['position'] ),
            'phone'       => sanitize_text_field( $_POST['phone'] ),
            'status'      => sanitize_text_field( $_POST['status'] ),
        );

        $result = $this->save_employee( $data );

        if ( false === $result ) {
            wp_send_json_error( 'Failed to save employee data.' );
        }

        wp_send_json_success( 'Employee saved successfully.' );
    }

    public function ajax_get_employee() {
        check_ajax_referer( 'ig_erp_nonce', 'nonce' );
        $user_id = intval( $_POST['user_id'] );
        $employee = $this->get_employee( $user_id );

        if ( $employee ) {
            wp_send_json_success( $employee );
        } else {
            wp_send_json_error( 'Employee not found.' );
        }
    }

    public function get_employee( $user_id ) {
        global $wpdb;
        return $wpdb->get_row( $wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}ig_employees WHERE user_id = %d",
            $user_id
        ) );
    }

    public function save_employee( $data ) {
        global $wpdb;
        $user_id = intval( $data['user_id'] );
        
        $exists = $this->get_employee( $user_id );

        if ( $exists ) {
            return $wpdb->update(
                "{$wpdb->prefix}ig_employees",
                $data,
                array( 'user_id' => $user_id )
            );
        } else {
            return $wpdb->insert(
                "{$wpdb->prefix}ig_employees",
                $data
            );
        }
    }

    public function ajax_delete_employee() {
        check_ajax_referer( 'ig_erp_nonce', 'nonce' );
        if ( ! current_user_can( 'manage_options' ) && ! current_user_can( 'edit_users' ) ) {
            wp_send_json_error( 'Unauthorized' );
        }

        $user_id = intval( $_POST['user_id'] );
        global $wpdb;
        $result = $wpdb->delete( "{$wpdb->prefix}ig_employees", array( 'user_id' => $user_id ) );

        if ( $result ) {
            wp_send_json_success( 'Employee record deleted.' );
        } else {
            wp_send_json_error( 'Failed to delete employee record.' );
        }
    }

    public function ajax_get_employee_profile() {
        check_ajax_referer( 'ig_erp_nonce', 'nonce' );
        if ( ! current_user_can( 'manage_options' ) ) {
            wp_send_json_error( 'Unauthorized' );
        }

        $user_id = intval( $_POST['user_id'] );
        global $wpdb;

        $employee = $wpdb->get_row( $wpdb->prepare(
            "SELECT e.*, u.display_name, u.user_email, s.name as shift_name, s.start_time, s.end_time
             FROM {$wpdb->prefix}ig_employees e 
             JOIN {$wpdb->users} u ON e.user_id = u.ID 
             LEFT JOIN {$wpdb->prefix}ig_shifts s ON e.shift_id = s.id
             WHERE e.user_id = %d",
            $user_id
        ) );

        if ( !$employee ) {
            wp_send_json_error( 'Employee not found.' );
        }

        // Attendance (Last 15)
        $attendance = $wpdb->get_results( $wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}ig_attendance WHERE employee_id = %d ORDER BY check_in DESC LIMIT 15",
            $employee->id
        ) );

        // Leaves (Last 10)
        $leaves = $wpdb->get_results( $wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}ig_leaves WHERE employee_id = %d ORDER BY start_date DESC LIMIT 10",
            $employee->id
        ) );

        wp_send_json_success( array(
            'employee'   => $employee,
            'attendance' => $attendance,
            'leaves'     => $leaves
        ) );
    }

    public function ajax_update_self_profile() {
        check_ajax_referer( 'ig_erp_nonce', 'nonce' );
        if ( ! is_user_logged_in() ) {
            wp_send_json_error( 'Unauthorized' );
        }

        $user_id = get_current_user_id();
        global $wpdb;

        $employee = $wpdb->get_row( $wpdb->prepare(
            "SELECT id FROM {$wpdb->prefix}ig_employees WHERE user_id = %d",
            $user_id
        ) );

        if ( !$employee ) {
            wp_send_json_error( 'Employee record not found.' );
        }

        $data = array(
            'phone'      => sanitize_text_field( $_POST['phone'] ),
            'department' => sanitize_text_field( $_POST['department'] ),
            'position'   => sanitize_text_field( $_POST['position'] ),
        );

        $result = $wpdb->update(
            "{$wpdb->prefix}ig_employees",
            $data,
            array( 'user_id' => $user_id )
        );

        if ( false === $result ) {
            wp_send_json_error( 'Failed to update profile.' );
        }

        wp_send_json_success( 'Profile updated successfully.' );
    }

    public function ajax_get_self_profile() {
        check_ajax_referer( 'ig_erp_nonce', 'nonce' );
        if ( ! is_user_logged_in() ) {
            wp_send_json_error( 'Unauthorized' );
        }

        $user_id = get_current_user_id();
        $employee = $this->get_employee( $user_id );

        if ( $employee ) {
            $role = 'employee';
            if ( current_user_can( 'manage_options' ) ) {
                $role = 'admin';
            } elseif ( current_user_can( 'edit_users' ) ) {
                $role = 'hr';
            }
            $employee->role = $role;
            $employee->is_manager = ( $role === 'admin' || $role === 'hr' );
            wp_send_json_success( $employee );
        } else {
            wp_send_json_error( 'Employee record not found.' );
        }
    }

    public function ajax_bulk_action_employees() {
        check_ajax_referer( 'ig_erp_nonce', 'nonce' );
        if ( ! current_user_can( 'manage_options' ) ) {
            wp_send_json_error( 'Unauthorized' );
        }

        $employee_ids = isset( $_POST['employee_ids'] ) ? array_map( 'intval', $_POST['employee_ids'] ) : [];
        $bulk_action  = sanitize_text_field( $_POST['bulk_action'] );

        if ( empty( $employee_ids ) ) {
            wp_send_json_error( 'No employees selected.' );
        }

        global $wpdb;
        $table_name = "{$wpdb->prefix}ig_employees";
        $ids_placeholder = implode( ',', array_fill( 0, count( $employee_ids ), '%d' ) );

        switch ( $bulk_action ) {
            case 'delete':
                $result = $wpdb->query( $wpdb->prepare(
                    "DELETE FROM $table_name WHERE user_id IN ($ids_placeholder)",
                    ...$employee_ids
                ) );
                break;

            case 'set-active':
                $result = $wpdb->query( $wpdb->prepare(
                    "UPDATE $table_name SET status = 'active' WHERE user_id IN ($ids_placeholder)",
                    ...$employee_ids
                ) );
                break;

            case 'set-inactive':
                $result = $wpdb->query( $wpdb->prepare(
                    "UPDATE $table_name SET status = 'inactive' WHERE user_id IN ($ids_placeholder)",
                    ...$employee_ids
                ) );
                break;

            default:
                wp_send_json_error( 'Invalid bulk action.' );
        }

        if ( false === $result ) {
            wp_send_json_error( 'Bulk action failed.' );
        }

        wp_send_json_success( 'Bulk action completed successfully.' );
    }
}

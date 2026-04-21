<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

global $wpdb;
$leaves = $wpdb->get_results( "
    SELECT l.*, u.display_name, e.employee_no 
    FROM {$wpdb->prefix}ig_leaves l
    JOIN {$wpdb->prefix}ig_employees e ON l.employee_id = e.id
    JOIN {$wpdb->users} u ON e.user_id = u.ID
    ORDER BY l.id DESC
" );
?>

<div class="wrap ig-erp-admin">
    <h1 class="wp-heading-inline">Leave Management</h1>
    <hr class="wp-header-end">

    <div style="margin-top: 20px;">
        <table class="wp-list-table widefat fixed striped">
            <thead>
                <tr>
                    <th>Employee</th>
                    <th>Type</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                <?php if ( ! empty( $leaves ) ) : ?>
                    <?php foreach ( $leaves as $leave ) : ?>
                        <tr>
                            <td>
                                <strong><?php echo esc_html( $leave->display_name ); ?></strong><br>
                                <small>ID: <?php echo esc_html( $leave->employee_no ); ?></small>
                            </td>
                            <td><?php echo esc_html( ucfirst( $leave->leave_type ) ); ?></td>
                            <td><?php echo esc_html( $leave->start_date ); ?></td>
                            <td><?php echo esc_html( $leave->end_date ); ?></td>
                            <td><?php echo esc_html( $leave->reason ); ?></td>
                            <td>
                                <span class="status-pill status-<?php echo esc_attr( $leave->status ); ?>">
                                    <?php echo esc_html( ucfirst( $leave->status ) ); ?>
                                </span>
                            </td>
                            <td>
                                <?php if ( $leave->status === 'pending' ) : ?>
                                    <button class="button button-primary approve-leave" data-id="<?php echo esc_attr( $leave->id ); ?>">Approve</button>
                                    <button class="button button-link-delete reject-leave" data-id="<?php echo esc_attr( $leave->id ); ?>">Reject</button>
                                <?php else : ?>
                                    <span class="description">Processed</span>
                                <?php endif; ?>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                <?php else : ?>
                    <tr>
                        <td colspan="7">No leave requests found.</td>
                    </tr>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
</div>

<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}
?>

<div class="wrap ig-erp-admin">
    <h1 class="wp-heading-inline">Employees</h1>
    <a href="#ig-erp-employee-form" class="page-title-action" id="add-new-employee">Add New</a>
    <hr class="wp-header-end">

    <div style="background: #fff; padding: 20px; border: 1px solid #ccd0d4; margin-top: 20px; border-radius: 4px;">
        <h3 class="form-title">Add/Edit Employee</h3>
        <form id="ig-erp-employee-form" method="post">
            <table class="form-table">
                <tr>
                    <th><label for="user_id">WordPress User</label></th>
                    <td>
                        <select name="user_id" id="user_id" required>
                            <option value="">Select User...</option>
                            <?php
                            $users = get_users();
                            global $wpdb;
                            $existing_user_ids = $wpdb->get_col( "SELECT user_id FROM {$wpdb->prefix}ig_employees" );
                            
                            foreach ( $users as $user ) {
                                // If editing, we'll need to show the current user regardless, but for now let's just show all and JS will handle the rest or we can be smarter
                                // Actually, it's better to show all but mark which ones are already employees in a data attribute?
                                // Or simpler: just list them all, and the Save logic handles it.
                                // But the user said "enable", maybe the Save was failing because of duplicate user_id?
                                // My save_employee handles exists -> update, so it shouldn't fail.
                                echo '<option value="' . esc_attr( $user->ID ) . '">' . esc_html( $user->display_name ) . ' (' . esc_html( $user->user_email ) . ')</option>';
                            }
                            ?>
                        </select>
                    </td>
                </tr>
                <tr>
                    <th><label for="employee_no">Employee ID #</label></th>
                    <td><input type="text" name="employee_no" id="employee_no" required placeholder="E.g. EMP-001"></td>
                </tr>
                <tr>
                    <th><label for="shift_id">Assigned Shift</label></th>
                    <td>
                        <select name="shift_id" id="shift_id_select">
                            <option value="">No Shift Assigned</option>
                            <?php
                            $shifts = \IG_ERP\Shifts::get_instance()->get_shifts();
                            foreach ( $shifts as $shift ) {
                                echo '<option value="' . esc_attr( $shift->id ) . '">' . esc_html( $shift->name ) . '</option>';
                            }
                            ?>
                        </select>
                    </td>
                </tr>
                <tr>
                    <th><label for="department">Department</label></th>
                    <td><input type="text" name="department" id="department" placeholder="E.g. Engineering"></td>
                </tr>
                <tr>
                    <th><label for="position">Position</label></th>
                    <td><input type="text" name="position" id="position" placeholder="E.g. Senior Developer"></td>
                </tr>
                <tr>
                    <th><label for="phone">Phone</label></th>
                    <td><input type="text" name="phone" id="phone"></td>
                </tr>
                <tr>
                    <th><label for="status">Status</label></th>
                    <td>
                        <select name="status" id="status">
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="on-leave">On Leave</option>
                        </select>
                    </td>
                </tr>
            </table>
            <p class="submit">
                <button type="submit" class="button button-primary">Save Employee Record</button>
                <button type="button" class="button" id="reset-form">Reset</button>
            </p>
        </form>
    </div>

    <h2 style="margin-top: 30px;">Employee List</h2>
    
    <div class="tablenav top">
        <div class="alignleft actions bulkactions">
            <select name="action" id="bulk-action-selector-top">
                <option value="-1">Bulk actions</option>
                <option value="delete">Delete Permanently</option>
                <option value="set-active">Set Status: Active</option>
                <option value="set-inactive">Set Status: Inactive</option>
            </select>
            <input type="button" id="doaction" class="button action" value="Apply">
        </div>
    </div>

    <table class="wp-list-table widefat fixed striped">
        <thead>
            <tr>
                <td id="cb" class="manage-column column-cb check-column"><input id="cb-select-all-1" type="checkbox"></td>
                <th>Name</th>
                <th>Employee #</th>
                <th>Shift</th>
                <th>Department</th>
                <th>Position</th>
                <th>Status</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>
            <?php
            global $wpdb;
            $employees = $wpdb->get_results(
                "SELECT e.*, u.display_name, u.user_email, s.name as shift_name 
                 FROM {$wpdb->prefix}ig_employees e 
                 JOIN {$wpdb->users} u ON e.user_id = u.ID 
                 LEFT JOIN {$wpdb->prefix}ig_shifts s ON e.shift_id = s.id
                 ORDER BY e.id DESC"
            );
            
            if ( ! empty( $employees ) ) :
                foreach ( $employees as $emp ) : ?>
                    <tr>
                        <th scope="row" class="check-column">
                            <input type="checkbox" name="employee_ids[]" value="<?php echo esc_attr( $emp->user_id ); ?>">
                        </th>
                        <td>
                            <strong><?php echo esc_html( $emp->display_name ); ?></strong><br>
                            <small><?php echo esc_html( $emp->user_email ); ?></small>
                        </td>
                        <td><?php echo esc_html( $emp->employee_no ); ?></td>
                        <td><?php echo esc_html( $emp->shift_name ? $emp->shift_name : 'None' ); ?></td>
                        <td><?php echo esc_html( $emp->department ); ?></td>
                        <td><?php echo esc_html( $emp->position ); ?></td>
                        <td>
                            <span class="status-pill status-<?php echo esc_attr( $emp->status ); ?>">
                                <?php echo esc_html( ucfirst( $emp->status ) ); ?>
                            </span>
                        </td>
                        <td>
                            <button class="button button-small view-employee" data-user-id="<?php echo esc_attr( $emp->user_id ); ?>">Profile</button>
                            <button class="button button-small edit-employee" data-user-id="<?php echo esc_attr( $emp->user_id ); ?>">Edit</button>
                            <button class="button button-small delete-employee" style="color: #d63638;" data-user-id="<?php echo esc_attr( $emp->user_id ); ?>">Delete</button>
                        </td>
                    </tr>
                <?php endforeach;
            else : ?>
                <tr>
                    <td colspan="7">No employees found.</td>
                </tr>
            <?php endif; ?>
        </tbody>
    </table>

    <!-- Employee Profile Modal -->
    <div id="employee-profile-modal" class="ig-erp-modal">
        <div class="ig-erp-modal-content">
            <span class="close-modal">&times;</span>
            <h2 id="profile-name">Employee Profile</h2>
            <hr>
            
            <div id="profile-content">
                <div class="profile-section">
                    <h4>Basic Information</h4>
                    <div id="p-shift-banner" class="shift-highlight">
                        <span class="label">Assigned Shift</span>
                        <span id="p-shift" class="value">No Shift Assigned</span>
                    </div>
                    <div class="profile-grid" style="margin-top: 15px;">
                        <div class="profile-item"><label>Employee ID</label><span id="p-id"></span></div>
                        <div class="profile-item"><label>Email</label><span id="p-email"></span></div>
                        <div class="profile-item"><label>Phone</label><span id="p-phone"></span></div>
                        <div class="profile-item"><label>Department</label><span id="p-dept"></span></div>
                        <div class="profile-item"><label>Position</label><span id="p-pos"></span></div>
                    </div>
                </div>

                <div class="profile-section">
                    <h4>Current Status</h4>
                    <div class="profile-grid">
                        <div class="profile-item"><label>Status</label><span id="p-status"></span></div>
                        <div class="profile-item"><label>Shift Hours</label><span id="p-hours"></span></div>
                    </div>
                </div>

                <div class="profile-section">
                    <h4>Recent Attendance</h4>
                    <table class="wp-list-table widefat fixed striped">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Check In</th>
                                <th>Check Out</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody id="p-attendance-list">
                            <!-- JS populated -->
                        </tbody>
                    </table>
                </div>

                <div class="profile-section">
                    <h4>Recent Leaves</h4>
                    <table class="wp-list-table widefat fixed striped">
                        <thead>
                            <tr>
                                <th>Dates</th>
                                <th>Type</th>
                                <th>Reason</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody id="p-leave-list">
                            <!-- JS populated -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</div>

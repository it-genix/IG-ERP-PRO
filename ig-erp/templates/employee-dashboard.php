<?php
if ( ! defined( 'ABSPATH' ) ) exit;

$user_id = get_current_user_id();
$employee_data = \IG_ERP\Employees::get_instance()->get_employee( $user_id );
?>

<div class="ig-erp-frontend">
    <div class="ig-erp-card">
        <h1>Welcome, <?php echo esc_html( wp_get_current_user()->display_name ); ?></h1>
        <p><?php echo esc_html( $employee_data->position ?? 'Employee' ); ?> | <?php echo esc_html( $employee_data->department ?? 'General' ); ?></p>
        
        <div class="attendance-controls">
            <button id="check-in-btn" class="ig-erp-btn btn-primary">Check In</button>
            <button id="check-out-btn" class="ig-erp-btn btn-danger">Check Out</button>
        </div>
    </div>

    <div class="stat-grid">
        <div class="ig-erp-card">
            <h3>Attendance Today</h3>
            <p>Not Present</p>
        </div>
        <div class="ig-erp-card">
            <h3>Leave Balance</h3>
            <p>12 Days</p>
        </div>
    </div>

    <div class="ig-erp-card">
        <h2>Submit Leave Request</h2>
        <form id="leave-request-form">
            <div class="form-group">
                <label>Leave Type</label>
                <select name="leave_type">
                    <option value="sick">Sick Leave</option>
                    <option value="annual">Annual Leave</option>
                </select>
            </div>
            <div class="form-group">
                <label>Dates</label>
                <input type="date" name="start_date"> to <input type="date" name="end_date">
            </div>
            <textarea name="reason" placeholder="Reason for leave..."></textarea>
            <button type="submit" class="ig-erp-btn btn-primary">Submit Request</button>
        </form>
    </div>
</div>

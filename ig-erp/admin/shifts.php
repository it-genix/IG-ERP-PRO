<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

function ig_erp_is_shift_overlapping($current_shift, $all_shifts) {
    if (empty($all_shifts)) return false;
    
    $start1 = strtotime($current_shift->start_time);
    $end1 = strtotime($current_shift->end_time);
    
    // Handle overnight shifts
    if ($end1 < $start1) {
        $end1 += 86400; // Add 24 hours
    }

    foreach ($all_shifts as $s) {
        if ($s->id == $current_shift->id) continue;

        $start2 = strtotime($s->start_time);
        $end2 = strtotime($s->end_time);

        if ($end2 < $start2) {
            $end2 += 86400;
        }

        // Check if [start1, end1] overlaps with [start2, end2]
        if ($start1 < $end2 && $start2 < $end1) {
            return true;
        }
        
        // Also check "next day" overlap for overnight shifts
        if ($start1 + 86400 < $end2 + 86400 && $start2 + 86400 < $end1 + 86400) {
            // This is actually covered if we just normalize both by adding 86400 if needed?
            // Actually the standard (StartA < EndB) && (StartB < EndA) works if we treat them correctly.
        }
    }
    return false;
}
?>

<style>
    .shift-assignment-pill {
        background: #e1f0ff;
        color: #0073aa;
        padding: 2px 8px;
        border-radius: 10px;
        font-size: 10px;
        font-weight: bold;
        text-transform: uppercase;
        margin-left: 8px;
    }
    .shift-overlap-warning {
        color: #d63638;
        font-size: 11px;
        font-weight: 600;
        display: flex;
        align-items: center;
        background: #fff5f5;
        padding: 2px 6px;
        border-radius: 4px;
        border: 1px solid #fecaca;
        width: fit-content;
    }
    .shift-row-overlapping {
        background-color: #fff5f5 !important;
    }
    .shift-row-overlapping td {
        border-bottom-color: #fecaca !important;
    }
</style>

<div class="wrap ig-erp-admin">
    <h1 class="wp-heading-inline">Attendance Shifts</h1>
    <hr class="wp-header-end">

    <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 20px; margin-top: 20px;">
        <!-- Add/Edit Form -->
        <div style="background: #fff; padding: 20px; border: 1px solid #ccd0d4; border-radius: 4px; height: fit-content;">
            <h3>Add/Edit Shift</h3>
            <form id="ig-erp-shift-form" method="post">
                <input type="hidden" name="id" id="shift_id" value="">
                <table class="form-table">
                    <tr>
                        <th><label for="name">Shift Name</label></th>
                        <td><input type="text" name="name" id="shift_name" required placeholder="E.g. Morning Shift" class="regular-text"></td>
                    </tr>
                    <tr>
                        <th><label for="start_time">Start Time</label></th>
                        <td><input type="time" name="start_time" id="shift_start" required class="regular-text"></td>
                    </tr>
                    <tr>
                        <th><label for="end_time">End Time</label></th>
                        <td><input type="time" name="end_time" id="shift_end" required class="regular-text"></td>
                    </tr>
                    <tr>
                        <th><label for="grace_period">Grace Period (Min)</label></th>
                        <td><input type="number" name="grace_period" id="shift_grace" value="0" min="0" class="regular-text"></td>
                    </tr>
                </table>
                <p class="submit">
                    <button type="submit" class="button button-primary">Save Shift</button>
                    <button type="button" class="button" id="reset-shift-form">Reset</button>
                </p>
            </form>
        </div>

        <!-- Shift List -->
        <div style="background: #fff; padding: 20px; border: 1px solid #ccd0d4; border-radius: 4px;">
            <h3>Defined Shifts</h3>
            <table class="wp-list-table widefat fixed striped">
                <thead>
                    <tr>
                        <th>Shift Name</th>
                        <th>Start Time</th>
                        <th>End Time</th>
                        <th>Status / Assignments</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <?php
                    $shifts_obj = \IG_ERP\Shifts::get_instance();
                    $shifts = $shifts_obj->get_shifts();
                    
                    if ( ! empty( $shifts ) ) :
                        foreach ( $shifts as $shift ) : 
                            $is_overlapping = ig_erp_is_shift_overlapping($shift, $shifts);
                            ?>
                            <tr class="<?php echo $is_overlapping ? 'shift-row-overlapping' : ''; ?>">
                                <td>
                                    <strong><?php echo esc_html( $shift->name ); ?></strong>
                                </td>
                                <td><?php echo esc_html( date( 'h:i A', strtotime( $shift->start_time ) ) ); ?></td>
                                <td><?php echo esc_html( date( 'h:i A', strtotime( $shift->end_time ) ) ); ?></td>
                                <td>
                                    <div style="display: flex; flex-direction: column; gap: 4px;">
                                        <?php if ($shift->employee_count > 0) : ?>
                                            <div><span class="shift-assignment-pill"><?php echo intval($shift->employee_count); ?> Assigned</span></div>
                                        <?php else : ?>
                                            <div><span style="color: #94a3b8; font-size: 10px; text-transform: uppercase; font-weight: bold;">Unassigned</span></div>
                                        <?php endif; ?>

                                        <?php if ($is_overlapping) : ?>
                                            <div class="shift-overlap-warning">
                                                <span class="dashicons dashicons-warning" style="font-size: 14px; width: 14px; height: 14px; margin-right: 2px;"></span>
                                                Overlapping Shift
                                            </div>
                                        <?php endif; ?>
                                    </div>
                                </td>
                                <td>
                                    <button class="button edit-shift" 
                                            data-id="<?php echo esc_attr( $shift->id ); ?>"
                                            data-name="<?php echo esc_attr( $shift->name ); ?>"
                                            data-start="<?php echo esc_attr( $shift->start_time ); ?>"
                                            data-end="<?php echo esc_attr( $shift->end_time ); ?>"
                                            data-grace="<?php echo esc_attr( $shift->grace_period ); ?>">Edit</button>
                                    <button class="button delete-shift" data-id="<?php echo esc_attr( $shift->id ); ?>" style="color: #a00;">Delete</button>
                                </td>
                            </tr>
                        <?php endforeach;
                    else : ?>
                        <tr>
                            <td colspan="5">No shifts defined yet.</td>
                        </tr>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
    </div>
</div>

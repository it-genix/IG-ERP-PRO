jQuery(document).ready(function($) {
    // Save Employee
    $('#ig-erp-employee-form').on('submit', function(e) {
        e.preventDefault();
        
        var formData = $(this).serialize();
        formData += '&action=ig_erp_save_employee&nonce=' + ig_erp.nonce;

        $.post(ig_erp.ajax_url, formData, function(response) {
            if (response.success) {
                alert(response.data);
                location.reload();
            } else {
                alert('Error: ' + response.data);
            }
        });
    });

    // Reset Form
    $('#reset-form, #add-new-employee').on('click', function() {
        $('#ig-erp-employee-form')[0].reset();
        $('#user_id').prop('disabled', false);
        $('#hidden_user_id').remove();
        $('.form-title').text('Add New Employee');
    });

    // Edit Employee
    $('.edit-employee').on('click', function() {
        var userId = $(this).data('user-id');
        $('.form-title').text('Edit Employee');
        
        $.post(ig_erp.ajax_url, {
            action: 'ig_erp_get_employee',
            nonce: ig_erp.nonce,
            user_id: userId
        }, function(response) {
            if (response.success) {
                var data = response.data;
                $('#user_id').val(data.user_id).prop('disabled', true);
                // We add a hidden field for user_id since disabled fields aren't serialized
                if (!$('#hidden_user_id').length) {
                    $('#ig-erp-employee-form').append('<input type="hidden" name="user_id" id="hidden_user_id">');
                }
                $('#hidden_user_id').val(data.user_id);
                
                $('#employee_no').val(data.employee_no);
                $('#shift_id_select').val(data.shift_id);
                $('#department').val(data.department);
                $('#position').val(data.position);
                $('#phone').val(data.phone);
                $('#status').val(data.status);
                
                $('html, body').animate({
                    scrollTop: $("#ig-erp-employee-form").offset().top - 50
                }, 500);
            } else {
                alert('Error: ' + response.data);
            }
        });
    });

    // Delete Employee
    $('.delete-employee').on('click', function() {
        if (!confirm('Are you sure you want to delete this employee record? WordPress user will not be deleted.')) return;
        
        var userId = $(this).data('user-id');
        $.post(ig_erp.ajax_url, {
            action: 'ig_erp_delete_employee',
            nonce: ig_erp.nonce,
            user_id: userId
        }, function(response) {
            if (response.success) {
                alert(response.data);
                location.reload();
            } else {
                alert('Error: ' + response.data);
            }
        });
    });

    // View Profile
    $('.view-employee').on('click', function() {
        var userId = $(this).data('user-id');
        
        $.post(ig_erp.ajax_url, {
            action: 'ig_erp_get_employee_profile',
            nonce: ig_erp.nonce,
            user_id: userId
        }, function(response) {
            if (response.success) {
                var data = response.data;
                var emp = data.employee;
                
                $('#profile-name').text(emp.display_name + ' - Profile');
                $('#p-id').text(emp.employee_no || 'N/A');
                $('#p-email').text(emp.user_email);
                $('#p-phone').text(emp.phone || 'N/A');
                $('#p-dept').text(emp.department || 'N/A');
                $('#p-pos').text(emp.position || 'N/A');
                $('#p-shift').text(emp.shift_name || 'No Shift Assigned');
                $('#p-status').text(emp.status.charAt(0).toUpperCase() + emp.status.slice(1));
                $('#p-hours').text(emp.start_time ? emp.start_time + ' - ' + emp.end_time : 'N/A');

                // Attendance
                var attHtml = '';
                if (data.attendance && data.attendance.length) {
                    data.attendance.forEach(function(a) {
                        attHtml += '<tr>';
                        attHtml += '<td>' + new Date(a.check_in).toLocaleDateString() + '</td>';
                        attHtml += '<td>' + new Date(a.check_in).toLocaleTimeString() + '</td>';
                        attHtml += '<td>' + (a.check_out ? new Date(a.check_out).toLocaleTimeString() : 'Active') + '</td>';
                        attHtml += '<td><span class="status-pill status-active">' + a.status + '</span></td>';
                        attHtml += '</tr>';
                    });
                } else {
                    attHtml = '<tr><td colspan="4">No attendance records found.</td></tr>';
                }
                $('#p-attendance-list').html(attHtml);

                // Leaves
                var leaveHtml = '';
                if (data.leaves && data.leaves.length) {
                    data.leaves.forEach(function(l) {
                        leaveHtml += '<tr>';
                        leaveHtml += '<td>' + l.start_date + ' to ' + l.end_date + '</td>';
                        leaveHtml += '<td>' + l.leave_type + '</td>';
                        leaveHtml += '<td>' + l.reason + '</td>';
                        leaveHtml += '<td><span class="status-pill status-' + l.status + '">' + l.status + '</span></td>';
                        leaveHtml += '</tr>';
                    });
                } else {
                    leaveHtml = '<tr><td colspan="4">No leave requests found.</td></tr>';
                }
                $('#p-leave-list').html(leaveHtml);

                $('#employee-profile-modal').fadeIn(300);
            } else {
                alert('Error: ' + response.data);
            }
        });
    });

    // Close Modal
    $('.close-modal').on('click', function() {
        $('.ig-erp-modal').fadeOut(300);
    });

    $(window).on('click', function(event) {
        if ($(event.target).hasClass('ig-erp-modal')) {
            $('.ig-erp-modal').fadeOut(300);
        }
    });

    // --- Bulk Actions ---

    // Select All
    $('#cb-select-all-1').on('change', function() {
        $('input[name="employee_ids[]"]').prop('checked', $(this).prop('checked'));
    });

    $('#doaction').on('click', function() {
        var action = $('#bulk-action-selector-top').val();
        if (action === '-1') {
            alert('Please select an action.');
            return;
        }

        var selectedIds = [];
        $('input[name="employee_ids[]"]:checked').each(function() {
            selectedIds.push($(this).val());
        });

        if (selectedIds.length === 0) {
            alert('Please select at least one employee.');
            return;
        }

        var actionText = $('#bulk-action-selector-top option:selected').text();
        var confirmMsg = 'Are you sure you want to "' + actionText + '" for ' + selectedIds.length + ' selected employee(s)?';
        
        if (!confirm(confirmMsg)) return;

        $.post(ig_erp.ajax_url, {
            action: 'ig_erp_bulk_action_employees',
            nonce: ig_erp.nonce,
            employee_ids: selectedIds,
            bulk_action: action
        }, function(response) {
            if (response.success) {
                alert(response.data);
                location.reload();
            } else {
                alert('Error: ' + response.data);
            }
        });
    });

    // --- Leaves Management ---

    $('.approve-leave, .reject-leave').on('click', function() {
        var $btn = $(this);
        var id = $btn.data('id');
        var status = $btn.hasClass('approve-leave') ? 'approved' : 'rejected';
        
        if (!confirm('Are you sure you want to ' + status + ' this leave request?')) return;

        $.post(ig_erp.ajax_url, {
            action: 'ig_erp_update_leave_status',
            nonce: ig_erp.nonce,
            id: id,
            status: status
        }, function(response) {
            if (response.success) {
                alert(response.data);
                location.reload();
            } else {
                alert('Error: ' + response.data);
            }
        });
    });

    // --- Shifts CRUD ---

    // Save Shift
    $('#ig-erp-shift-form').on('submit', function(e) {
        e.preventDefault();
        var formData = $(this).serialize();
        formData += '&action=ig_erp_save_shift&nonce=' + ig_erp.nonce;

        $.post(ig_erp.ajax_url, formData, function(response) {
            if (response.success) {
                alert(response.data);
                location.reload();
            } else {
                alert('Error: ' + response.data);
            }
        });
    });

    // Reset Shift Form
    $('#reset-shift-form').on('click', function() {
        $('#ig-erp-shift-form')[0].reset();
        $('#shift_id').val('');
    });

    // Edit Shift
    $('.edit-shift').on('click', function() {
        var $btn = $(this);
        $('#shift_id').val($btn.data('id'));
        $('#shift_name').val($btn.data('name'));
        $('#shift_start').val($btn.data('start'));
        $('#shift_end').val($btn.data('end'));
        $('#shift_grace').val($btn.data('grace'));
        
        $('html, body').animate({
            scrollTop: $("#ig-erp-shift-form").offset().top - 50
        }, 500);
    });

    // Delete Shift
    $('.delete-shift').on('click', function() {
        if (!confirm('Are you sure you want to delete this shift?')) return;
        
        var id = $(this).data('id');
        $.post(ig_erp.ajax_url, {
            action: 'ig_erp_delete_shift',
            nonce: ig_erp.nonce,
            id: id
        }, function(response) {
            if (response.success) {
                alert(response.data);
                location.reload();
            } else {
                alert('Error: ' + response.data);
            }
        });
    });
});

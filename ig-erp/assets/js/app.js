(function($) {
    'use strict';

    const IGERP = {
        init: function() {
            this.bindEvents();
        },

        bindEvents: function() {
            $('#check-in-btn').on('click', this.handleCheckIn.bind(this));
            $('#check-out-btn').on('click', this.handleCheckOut.bind(this));
            $('#leave-request-form').on('submit', this.handleLeaveSubmit.bind(this));
        },

        handleCheckIn: function(e) {
            e.preventDefault();
            this.getLocation((pos) => {
                this.ajaxAction('ig_erp_check_in', pos);
            });
        },

        handleCheckOut: function(e) {
            e.preventDefault();
            this.getLocation((pos) => {
                this.ajaxAction('ig_erp_check_out', pos);
            });
        },

        getLocation: function(callback) {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => callback({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    }),
                    (error) => alert('Geolocation failed: ' + error.message)
                );
            } else {
                alert('Geolocation not supported');
            }
        },

        ajaxAction: function(action, data) {
            $.ajax({
                url: ig_erp.ajax_url,
                method: 'POST',
                data: {
                    action: action,
                    nonce: ig_erp.nonce,
                    ...data
                },
                success: (res) => {
                    if (res.success) {
                        alert(res.data);
                        location.reload();
                    } else {
                        alert(res.data);
                    }
                }
            });
        },

        handleLeaveSubmit: function(e) {
            e.preventDefault();
            const formData = $(e.currentTarget).serializeArray();
            const data = {};
            formData.forEach(item => data[item.name] = item.value);
            this.ajaxAction('ig_erp_submit_leave', data);
        }
    };

    $(document).ready(() => IGERP.init());

})(jQuery);

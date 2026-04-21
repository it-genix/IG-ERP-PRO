(function($) {
    'use strict';

    let map;
    const markers = {};

    function initMap() {
        const mapContainer = document.getElementById('ig-erp-map');
        if (!mapContainer) return;

        // Using Leaflet for this example (No API key required by default)
        map = L.map('ig-erp-map').setView([0, 0], 2);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        fetchEmployees();
        setInterval(fetchEmployees, 30000); // Update every 30s
    }

    function fetchEmployees() {
        $.ajax({
            url: ig_erp.ajax_url,
            data: {
                action: 'ig_erp_get_locations',
                nonce: ig_erp.nonce
            },
            success: (res) => {
                if (res.success) {
                    updateMarkers(res.data);
                }
            }
        });
    }

    function updateMarkers(locations) {
        locations.forEach(loc => {
            const pos = [loc.lat, loc.lng];
            if (markers[loc.employee_id]) {
                markers[loc.employee_id].setLatLng(pos);
            } else {
                markers[loc.employee_id] = L.marker(pos)
                    .addTo(map)
                    .bindPopup(loc.employee_name);
            }
        });
    }

    $(document).ready(initMap);

})(jQuery);

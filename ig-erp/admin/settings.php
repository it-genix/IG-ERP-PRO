<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

if ( isset( $_POST['ig_erp_save_settings'] ) ) {
    check_admin_referer( 'ig_erp_settings_nonce' );
    $settings = array(
        'google_maps_key'        => sanitize_text_field( $_POST['google_maps_key'] ),
        'office_lat'             => sanitize_text_field( $_POST['office_lat'] ),
        'office_lng'             => sanitize_text_field( $_POST['office_lng'] ),
        'geofence_radius'        => intval( $_POST['geofence_radius'] ),
        'tracking_interval'      => intval( $_POST['tracking_interval'] ),
        'google_calendar_id'     => sanitize_text_field( $_POST['google_calendar_id'] ),
        'google_calendar_secret' => sanitize_text_field( $_POST['google_calendar_secret'] )
    );
    update_option( 'ig_erp_settings', $settings );
    echo '<div class="updated"><p>Settings saved successfully.</p></div>';
}

$settings = get_option( 'ig_erp_settings', [] );
?>

<div class="wrap ig-erp-admin">
    <h1 class="wp-heading-inline">Sentinel System Settings</h1>
    <hr class="wp-header-end">
    
    <form method="post" action="" style="margin-top: 20px;">
        <?php wp_nonce_field( 'ig_erp_settings_nonce' ); ?>
        
        <div style="background: #fff; padding: 20px; border: 1px solid #ccd0d4; border-radius: 4px; max-width: 800px;">
            <h3 style="margin-top: 0;">Geofencing & API Configuration</h3>
            <table class="form-table">
                <tr>
                    <th scope="row"><label for="google_maps_key">Google Maps API Key</label></th>
                    <td>
                        <input name="google_maps_key" type="text" id="google_maps_key" value="<?php echo esc_attr( $settings['google_maps_key'] ?? '' ); ?>" class="regular-text">
                        <p class="description">Used for address resolution and backend map integrations.</p>
                    </td>
                </tr>
                <tr>
                    <th scope="row"><label for="office_lat">Office Latitude</label></th>
                    <td>
                        <input name="office_lat" type="text" id="office_lat" value="<?php echo esc_attr( $settings['office_lat'] ?? '34.0522' ); ?>" class="regular-text">
                    </td>
                </tr>
                <tr>
                    <th scope="row"><label for="office_lng">Office Longitude</label></th>
                    <td>
                        <input name="office_lng" type="text" id="office_lng" value="<?php echo esc_attr( $settings['office_lng'] ?? '-118.2437' ); ?>" class="regular-text">
                        <p class="description">Center point of the authorized perimeter.</p>
                    </td>
                </tr>
                <tr>
                    <th scope="row"><label for="geofence_radius">Geofence Radius (Meters)</label></th>
                    <td>
                        <input name="geofence_radius" type="number" id="geofence_radius" value="<?php echo esc_attr( $settings['geofence_radius'] ?? 200 ); ?>" class="small-text">
                        <p class="description">Check-ins are only allowed within this radius.</p>
                    </td>
                </tr>
                <tr>
                    <th scope="row"><label for="tracking_interval">Live Tracking Sync (Seconds)</label></th>
                    <td>
                        <input name="tracking_interval" type="number" id="tracking_interval" value="<?php echo esc_attr( $settings['tracking_interval'] ?? 300 ); ?>" class="small-text">
                        <p class="description">Telemetric sync frequency for mobile nodes.</p>
                    </td>
                </tr>
            </table>

            <hr style="margin: 20px 0;">
            <h3 style="margin-top: 0;">External Integrations</h3>
            <table class="form-table">
                <tr>
                    <th scope="row"><label for="google_calendar_id">Google Client ID</label></th>
                    <td>
                        <input name="google_calendar_id" type="text" id="google_calendar_id" value="<?php echo esc_attr( $settings['google_calendar_id'] ?? '' ); ?>" class="regular-text">
                        <p class="description">Required for Google Calendar synchronization.</p>
                    </td>
                </tr>
                <tr>
                    <th scope="row"><label for="google_calendar_secret">Google Client Secret</label></th>
                    <td>
                        <input name="google_calendar_secret" type="password" id="google_calendar_secret" value="<?php echo esc_attr( $settings['google_calendar_secret'] ?? '' ); ?>" class="regular-text">
                    </td>
                </tr>
                <tr>
                    <th scope="row"><label>Sync Status</label></th>
                    <td>
                        <?php
                        $calendar = \IG_ERP\Calendar::get_instance();
                        if ( $calendar->is_connected() ) :
                            echo '<span style="color: #46b450; font-weight: bold;">Connected to Google Calendar</span>';
                            echo '<p><a href="' . esc_url( admin_url( 'admin.php?page=ig-erp-settings&ig_erp_calendar_disconnect=1' ) ) . '" class="button">Disconnect Account</a></p>';
                        else :
                            $auth_url = $calendar->get_auth_url();
                            if ( $auth_url ) :
                                echo '<a href="' . esc_url( $auth_url ) . '" class="button button-secondary">Connect Google Calendar</a>';
                                echo '<p class="description">Required for automatic leave request synchronization.</p>';
                            else :
                                echo '<span style="color: #dc3232;">Google Calendar Credentials Not Configured.</span>';
                                echo '<p class="description">Please enter your Client ID and Client Secret above and Save before connecting.</p>';
                            endif;
                        endif;
                        ?>
                    </td>
                </tr>
            </table>
        </div>
        
        <p class="submit">
            <input type="submit" name="ig_erp_save_settings" class="button button-primary" value="Save Configuration">
        </p>
    </form>
</div>

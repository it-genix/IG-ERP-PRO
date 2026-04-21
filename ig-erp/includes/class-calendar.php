<?php
namespace IG_ERP;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Calendar {
    private static $instance = null;
    private $token_option = 'ig_erp_google_calendar_token';
    private $settings_option = 'ig_erp_calendar_settings';

    private $auth_endpoint = 'https://accounts.google.com/o/oauth2/v2/auth';
    private $token_endpoint = 'https://oauth2.googleapis.com/token';
    private $calendar_endpoint = 'https://www.googleapis.com/calendar/v3/calendars';

    public static function get_instance() {
        if ( null === self::$instance ) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        add_action( 'admin_init', array( $this, 'handle_oauth_callback' ) );
        add_action( 'admin_init', array( $this, 'handle_disconnect' ) );
    }

    private function get_client_id() {
        $settings = get_option( 'ig_erp_settings', [] );
        if ( ! empty( $settings['google_calendar_id'] ) ) {
            return $settings['google_calendar_id'];
        }
        return getenv( 'GOOGLE_CALENDAR_CLIENT_ID' );
    }

    private function get_client_secret() {
        $settings = get_option( 'ig_erp_settings', [] );
        if ( ! empty( $settings['google_calendar_secret'] ) ) {
            return $settings['google_calendar_secret'];
        }
        return getenv( 'GOOGLE_CALENDAR_CLIENT_SECRET' );
    }

    public function handle_disconnect() {
        if ( isset( $_GET['ig_erp_calendar_disconnect'] ) && current_user_can( 'manage_options' ) ) {
            delete_option( $this->token_option );
            wp_redirect( admin_url( 'admin.php?page=ig-erp-settings&calendar_disconnected=1' ) );
            exit;
        }
    }

    public function is_connected() {
        $token = get_option( $this->token_option );
        return ! empty( $token['refresh_token'] ) || ! empty( $token['access_token'] );
    }

    public function get_auth_url() {
        $client_id = $this->get_client_id();
        if ( ! $client_id ) return '';

        $params = array(
            'client_id'     => $client_id,
            'redirect_uri'  => $this->get_redirect_uri(),
            'response_type' => 'code',
            'scope'         => 'https://www.googleapis.com/auth/calendar.events',
            'access_type'   => 'offline',
            'prompt'        => 'consent'
        );

        return $this->auth_endpoint . '?' . http_build_query( $params );
    }

    private function get_redirect_uri() {
        return admin_url( 'admin.php?page=ig-erp-settings&ig_erp_calendar_callback=1' );
    }

    public function handle_oauth_callback() {
        if ( ! isset( $_GET['ig_erp_calendar_callback'] ) || ! isset( $_GET['code'] ) ) {
            return;
        }

        if ( ! current_user_can( 'manage_options' ) ) {
            return;
        }

        $code = sanitize_text_field( $_GET['code'] );
        $client_id = $this->get_client_id();
        $client_secret = $this->get_client_secret();

        $response = wp_remote_post( $this->token_endpoint, array(
            'body' => array(
                'code'          => $code,
                'client_id'     => $client_id,
                'client_secret' => $client_secret,
                'redirect_uri'  => $this->get_redirect_uri(),
                'grant_type'    => 'authorization_code'
            )
        ) );

        if ( is_wp_error( $response ) ) {
            return;
        }

        $body = json_decode( wp_remote_retrieve_body( $response ), true );
        if ( isset( $body['access_token'] ) ) {
            $token_data = array(
                'access_token'  => $body['access_token'],
                'expires_in'    => $body['expires_in'],
                'created'       => time()
            );

            if ( isset( $body['refresh_token'] ) ) {
                $token_data['refresh_token'] = $body['refresh_token'];
            } else {
                // Keep old refresh token if not provided in this flow
                $old_token = get_option( $this->token_option );
                if ( ! empty( $old_token['refresh_token'] ) ) {
                    $token_data['refresh_token'] = $old_token['refresh_token'];
                }
            }

            update_option( $this->token_option, $token_data );
            wp_redirect( admin_url( 'admin.php?page=ig-erp-settings&calendar_connected=1' ) );
            exit;
        }
    }

    public function get_access_token() {
        $token = get_option( $this->token_option );
        if ( ! $token ) return false;

        // Check expiry (give 5 mins buffer)
        if ( ( $token['created'] + $token['expires_in'] - 300 ) < time() ) {
            return $this->refresh_access_token();
        }

        return $token['access_token'];
    }

    private function refresh_access_token() {
        $token = get_option( $this->token_option );
        if ( empty( $token['refresh_token'] ) ) return false;

        $client_id = $this->get_client_id();
        $client_secret = $this->get_client_secret();

        $response = wp_remote_post( $this->token_endpoint, array(
            'body' => array(
                'refresh_token' => $token['refresh_token'],
                'client_id'     => $client_id,
                'client_secret' => $client_secret,
                'grant_type'    => 'refresh_token'
            )
        ) );

        if ( is_wp_error( $response ) ) return false;

        $body = json_decode( wp_remote_retrieve_body( $response ), true );
        if ( isset( $body['access_token'] ) ) {
            $token['access_token'] = $body['access_token'];
            $token['expires_in']   = $body['expires_in'];
            $token['created']      = time();
            update_option( $this->token_option, $token );
            return $token['access_token'];
        }

        return false;
    }

    public function add_leave_to_calendar( $leave_id ) {
        if ( ! $this->is_connected() ) return false;

        $access_token = $this->get_access_token();
        if ( ! $access_token ) return false;

        global $wpdb;
        $leave = $wpdb->get_row( $wpdb->prepare(
            "SELECT l.*, u.display_name 
             FROM {$wpdb->prefix}ig_leaves l
             JOIN {$wpdb->prefix}ig_employees e ON l.employee_id = e.id
             JOIN {$wpdb->users} u ON e.user_id = u.ID
             WHERE l.id = %d",
            $leave_id
        ) );

        if ( ! $leave ) return false;

        $event = array(
            'summary'     => 'Leave: ' . $leave->display_name . ' (' . ucfirst( $leave->leave_type ) . ')',
            'description' => 'ERP Leave Request ID: ' . $leave->id . "\nReason: " . $leave->reason,
            'start'       => array(
                'date' => $leave->start_date
            ),
            'end'         => array(
                'date' => date( 'Y-m-d', strtotime( $leave->end_date . ' +1 day' ) ) // All-day event end is exclusive in Google
            )
        );

        $calendar_id = 'primary'; // Use primary calendar for now

        $response = wp_remote_post( $this->calendar_endpoint . '/' . $calendar_id . '/events', array(
            'headers' => array(
                'Authorization' => 'Bearer ' . $access_token,
                'Content-Type'  => 'application/json'
            ),
            'body' => json_encode( $event )
        ) );

        if ( is_wp_error( $response ) ) return false;

        return true;
    }
}

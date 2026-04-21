<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

$stats = \IG_ERP\Analytics::get_instance()->get_dashboard_stats();
?>

<div class="wrap ig-erp-admin">
    <h1>IG-ERP Dashboard</h1>
    
    <div class="ig-erp-stats-grid">
        <div class="ig-erp-stat-card">
            <h3>Total Employees</h3>
            <p class="number"><?php echo esc_html( $stats['total_employees'] ); ?></p>
        </div>
        <div class="ig-erp-stat-card">
            <h3>Present Today</h3>
            <p class="number"><?php echo esc_html( $stats['present_today'] ); ?></p>
        </div>
        <div class="ig-erp-stat-card">
            <h3>Attendance Rate</h3>
            <p class="number"><?php echo esc_html( number_format( $stats['attendance_rate'], 1 ) ); ?>%</p>
        </div>
    </div>

    <div class="ig-erp-dashboard-main">
        <div class="ig-erp-card">
            <h2>Live Attendance</h2>
            <div id="attendance-log">
                <!-- AJAX loaded attendance logs -->
                <p>Loading latest logs...</p>
            </div>
        </div>
    </div>
</div>

<style>
.ig-erp-stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 20px; }
.ig-erp-stat-card { background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border-left: 4px solid #2271b1; }
.ig-erp-stat-card h3 { margin: 0; font-size: 14px; color: #646970; }
.ig-erp-stat-card .number { font-size: 32px; font-weight: bold; margin: 10px 0 0; color: #1d2327; }
.ig-erp-card { background: #fff; padding: 20px; border-radius: 8px; margin-top: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
</style>

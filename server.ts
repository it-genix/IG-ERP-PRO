import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Mock WordPress AJAX Endpoint
  app.post('/wp-admin/admin-ajax.php', (req, res) => {
    const action = req.body.action;

    // Simulate different responses based on action
    switch (action) {
      case 'ig_erp_get_self_profile':
        return res.json({
          success: true,
          data: {
            phone: '+1 555-0199',
            department: 'Sentinel Security Team',
            position: 'Elite Operator',
            is_manager: true
          }
        });
      
      case 'ig_erp_get_self_leaves':
        return res.json({
          success: true,
          data: [
            { id: 1, leave_type: 'medical', start_date: '2026-04-10', end_date: '2026-04-12', reason: 'Flu recovery', status: 'approved' },
            { id: 2, leave_type: 'vacation', start_date: '2026-05-01', end_date: '2026-05-05', reason: 'Annual leave', status: 'pending' },
            { id: 3, user_name: 'John Doe', leave_type: 'casual', start_date: '2026-04-22', end_date: '2026-04-23', reason: 'Family emergency', status: 'pending' }
          ]
        });

      case 'ig_erp_get_team_availability':
        return res.json({
          success: true,
          data: [
            { display_name: 'Alan Turing', leave_type: 'medical', start_date: '2026-04-21', end_date: '2026-04-23' },
            { display_name: 'Grace Hopper', leave_type: 'vacation', start_date: '2026-04-20', end_date: '2026-04-25' }
          ]
        });

      case 'ig_erp_update_leave_status':
        return res.json({
          success: true,
          data: 'Leave request ' + req.body.status
        });

      case 'ig_erp_get_dashboard_stats':
        return res.json({
          success: true,
          data: {
            total_employees: 156,
            present_today: 142,
            on_leave: 8,
            pending_requests: 6
          }
        });

      default:
        return res.status(404).json({ success: false, data: 'Unknown action: ' + action });
    }
  });

  // Handle Vite
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Sentinel Core Server running on http://localhost:${PORT}`);
  });
}

startServer();

import { useState, useEffect } from 'react';
import { 
  Users, 
  Clock, 
  MapPin, 
  FileText, 
  Settings, 
  LayoutDashboard, 
  Calendar,
  LogOut,
  ChevronRight,
  Code,
  Download,
  CheckCircle2,
  AlertCircle,
  Menu,
  X,
  UserPlus,
  ShieldAlert,
  Brain,
  BarChart3,
  Lock,
  Cpu,
  Bell,
  ClipboardList,
  Activity,
  UserCheck,
  User
} from 'lucide-react';
import { FraudDetection } from './components/FraudDetection';
import { EmployeeDashboard } from './components/EmployeeDashboard';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

// --- Mock Data ---
const ATTENDANCE_DATA = [
  { name: 'Mon', present: 45, late: 5 },
  { name: 'Tue', present: 48, late: 2 },
  { name: 'Wed', present: 42, late: 8 },
  { name: 'Thu', present: 50, late: 0 },
  { name: 'Fri', present: 47, late: 3 },
];

const LEAVE_DATA = [
  { name: 'Jan', total: 12 },
  { name: 'Feb', total: 18 },
  { name: 'Mar', total: 15 },
  { name: 'Apr', total: 25 },
];

const PLUGIN_FILES = [
  { name: 'ig-erp.php', type: 'php', path: '/ig-erp/ig-erp.php' },
  { name: 'class-core.php', type: 'php', path: '/ig-erp/includes/class-core.php' },
  { name: 'class-attendance.php', type: 'php', path: '/ig-erp/includes/class-attendance.php' },
  { name: 'tables.php', type: 'php', path: '/ig-erp/database/tables.php' },
  { name: 'app.js', type: 'js', path: '/ig-erp/assets/js/app.js' },
  { name: 'style.css', type: 'css', path: '/ig-erp/assets/css/style.css' },
  { name: 'README.md', type: 'md', path: '/ig-erp/README.md' },
];

// --- Components ---

const StatCard = ({ title, value, icon: Icon, trend, trendLabel }: any) => (
  <div className="bg-white p-5 rounded-wp border border-wp-border shadow-sm">
    <div className="flex justify-between items-start mb-3">
      <div className="p-2 bg-slate-50 rounded">
        <Icon className="w-5 h-5 text-wp-muted" />
      </div>
      {trend && (
        <span className={cn(
          "text-[10px] font-bold px-2 py-0.5 rounded-full",
          trend > 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
        )}>
          {trend > 0 ? "+" : ""}{trend}%
        </span>
      )}
    </div>
    <h3 className="text-wp-muted text-[11px] font-bold uppercase tracking-wider mb-1">{title}</h3>
    <p className="text-2xl font-bold text-wp-text">{value}</p>
    {trendLabel && <p className="text-[11px] text-wp-muted mt-2">{trendLabel}</p>}
  </div>
);

const NavItem = ({ icon: Icon, label, active, onClick, open }: any) => (
  <button 
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 px-4 py-2.5 transition-all duration-200 group text-sm",
      active 
        ? "bg-wp-blue text-white" 
        : "text-[#c3c4c7] hover:bg-white/5 hover:text-white"
    )}
  >
    <Icon className={cn("w-4.5 h-4.5", active ? "text-white" : "text-[#c3c4c7] opacity-70 group-hover:opacity-100")} />
    {open && <span className="font-medium text-left flex-1">{label}</span>}
  </button>
);

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);
  const [selectedTrackingUser, setSelectedTrackingUser] = useState<any>(null);
  const [autoAttendanceEnabled, setAutoAttendanceEnabled] = useState(true);
  const [lastTelemetrySent, setLastTelemetrySent] = useState<number>(0);
  const [currentDistance, setCurrentDistance] = useState<number | null>(null);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  const [geofenceRadius, setGeofenceRadius] = useState(220); // Meters
  const [officeLat, setOfficeLat] = useState(34.0522);
  const [officeLng, setOfficeLng] = useState(-118.2437);

  // Helper: Haversine distance
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371000; // Earth radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // 🛰️ SMART BACKGROUND ENGINE
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (autoAttendanceEnabled) {
      interval = setInterval(() => {
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude, accuracy } = position.coords;
              const dist = calculateDistance(latitude, longitude, officeLat, officeLng);
              setCurrentDistance(dist);

              // 1. 20-Sec Live Tracking Sync
              const now = Date.now();
              if (now - lastTelemetrySent > 20000) {
                console.log(`📡 [Sentinel] Telemetry sync: ${latitude}, ${longitude}`);
                // In real app, call API: /wp-json/ig-erp/v1/telemetry
                setLastTelemetrySent(now);
              }

              // 2. Auto-Attendance Trigger
              if (dist <= geofenceRadius && !checkedIn) {
                console.log("📍 [Sentinel] Auto Check-in triggered: Inside geofence");
                setCheckedIn(true);
                setErrorStatus(null);
              } else if (dist > geofenceRadius && checkedIn) {
                 console.log("📍 [Sentinel] Auto Check-out triggered: Left geofence");
                 setCheckedIn(false);
              }
            },
            (error) => console.error("GPS Error:", error),
            { enableHighAccuracy: true }
          );
        }
      }, 5000); // Check every 5 seconds for movement, sync every 20s
    }

    return () => clearInterval(interval);
  }, [autoAttendanceEnabled, checkedIn, lastTelemetrySent]);

  const toggleCheckIn = () => {
    if (checkingIn) return;
    
    setErrorStatus(null);
    setCheckingIn(true);
    
    // Simulate API/GPS check
    setTimeout(() => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            const dist = calculateDistance(latitude, longitude, officeLat, officeLng);
            setCurrentDistance(dist);
            
            if (!checkedIn && dist > geofenceRadius) {
              setErrorStatus(`Access Denied: You are ${Math.round(dist)}m away from HQ. Geofence violation.`);
              setCheckingIn(false);
              return;
            }
            
            setCheckingIn(false);
            setCheckedIn(!checkedIn);
          },
          (err) => {
            setErrorStatus("GPS Synchronization Failed. Please enable location.");
            setCheckingIn(false);
          }
        );
      } else {
        setErrorStatus("Sentinel System error: Geolocation unavailable.");
        setCheckingIn(false);
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-wp-bg flex text-wp-text">
      {/* Sidebar */}
      <aside className={cn(
        "bg-wp-dark transition-all duration-300 flex flex-col fixed inset-y-0 left-0 z-50 text-[#c3c4c7]",
        sidebarOpen ? "w-[220px]" : "w-16"
      )}>
        <div className="h-[60px] flex items-center px-5 border-b border-white/10 shrink-0">
          <div className="w-8 h-8 bg-wp-blue rounded flex items-center justify-center shrink-0">
            <LayoutDashboard className="text-white w-5 h-5" />
          </div>
          {sidebarOpen && <span className="font-bold text-white ml-3 text-lg">IG-ERP PRO</span>}
        </div>

        <nav className="flex-1 py-3 overflow-y-auto">
          <NavItem 
            icon={User} 
            label="My Portal" 
            active={activeTab === 'portal'} 
            onClick={() => setActiveTab('portal')} 
            open={sidebarOpen}
          />
          <div className="h-px bg-white/5 mx-4 my-2" />
          <NavItem 
            icon={LayoutDashboard} 
            label="Dashboard" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
            open={sidebarOpen}
          />
          <NavItem 
            icon={Users} 
            label="Employees" 
            active={activeTab === 'employees'} 
            onClick={() => setActiveTab('employees')} 
            open={sidebarOpen}
          />
          <NavItem 
            icon={ClipboardList} 
            label="Attendance" 
            active={activeTab === 'attendance'} 
            onClick={() => setActiveTab('attendance')} 
            open={sidebarOpen}
          />
          <NavItem 
            icon={MapPin} 
            label="Live Tracking" 
            active={activeTab === 'tracking'} 
            onClick={() => setActiveTab('tracking')} 
            open={sidebarOpen}
          />
          <NavItem 
            icon={Calendar} 
            label="Leaves" 
            active={activeTab === 'leaves'} 
            onClick={() => setActiveTab('leaves')} 
            open={sidebarOpen}
          />
          <NavItem 
            icon={BarChart3} 
            label="Analytics" 
            active={activeTab === 'analytics'} 
            onClick={() => setActiveTab('analytics')} 
            open={sidebarOpen}
          />
          <NavItem 
            icon={ShieldAlert} 
            label="Sentinel AI" 
            active={activeTab === 'fraud'} 
            onClick={() => setActiveTab('fraud')} 
            open={sidebarOpen}
          />
          <NavItem 
            icon={Lock} 
            label="Permissions" 
            active={activeTab === 'roles'} 
            onClick={() => setActiveTab('roles')} 
            open={sidebarOpen}
          />
          <NavItem 
            icon={Bell} 
            label="Notifications" 
            active={activeTab === 'notifications'} 
            onClick={() => setActiveTab('notifications')} 
            open={sidebarOpen}
          />
          <NavItem 
            icon={Cpu} 
            label="API Control" 
            active={activeTab === 'api'} 
            onClick={() => setActiveTab('api')} 
            open={sidebarOpen}
          />
          <NavItem 
            icon={Settings} 
            label="Settings" 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')} 
            open={sidebarOpen}
          />
        </nav>

        <div className="p-4 border-t border-white/10 opacity-50">
           {sidebarOpen && <p className="text-[10px] text-center">v1.2.4 (Enterprise)</p>}
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "flex-1 transition-all duration-300",
        sidebarOpen ? "pl-[220px]" : "pl-16"
      )}>
        <header className="h-[60px] bg-white border-b border-wp-border sticky top-0 z-40 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1 hover:bg-slate-50 rounded"
            >
              <Menu className="w-4 h-4 text-wp-muted" />
            </button>
            <div className="text-sm font-medium text-wp-muted">
              Dashboard / <span className="text-wp-text capitalize">{activeTab}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-sm font-semibold text-right">
              <p className="leading-none mb-0.5">Admin User</p>
              <p className="text-[11px] text-wp-muted uppercase font-bold tracking-tight">Super User</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-200 border border-wp-border overflow-hidden">
               <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=Admin`} alt="avatar" />
            </div>
          </div>
        </header>

        <div className="p-6 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'portal' && (
              <motion.div 
                key="portal"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <EmployeeDashboard 
                  officeLat={officeLat} 
                  officeLng={officeLng} 
                  geofenceRadius={geofenceRadius} 
                />
              </motion.div>
            )}

            {activeTab === 'dashboard' && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center bg-white p-6 rounded-wp border border-wp-border shadow-sm mb-6">
                   <div>
                      <h1 className="text-2xl font-bold text-wp-dark font-serif tracking-tight">Sentinel Command Center</h1>
                      <p className="text-[10px] font-bold text-wp-muted uppercase tracking-widest mt-1">AI Autonomous Mode Active</p>
                   </div>
                   <div className="flex items-center gap-4">
                      <div className="flex flex-col items-end border-r border-wp-border pr-4 mr-4">
                         <span className="text-[9px] font-bold text-wp-muted uppercase text-right">Geofence Distance</span>
                         <span className="text-xl font-bold text-wp-blue font-mono">
                            {currentDistance !== null ? `${Math.round(currentDistance)}M` : "---"}
                         </span>
                      </div>
                      <div className="flex items-center gap-3 bg-slate-50 border border-wp-border p-1 rounded-full px-4">
                         <span className="text-[10px] font-bold uppercase text-wp-muted text-right">Auto-Pilot</span>
                         <button 
                            onClick={() => setAutoAttendanceEnabled(!autoAttendanceEnabled)}
                            className={cn(
                               "w-10 h-5 rounded-full relative transition-all",
                               autoAttendanceEnabled ? "bg-wp-blue" : "bg-slate-300"
                            )}
                         >
                            <div className={cn(
                               "absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all",
                               autoAttendanceEnabled ? "left-[22px]" : "left-0.5"
                            )} />
                         </button>
                      </div>
                      <button 
                        onClick={toggleCheckIn}
                        className={cn(
                          "px-6 py-2 rounded-wp font-bold text-xs shadow-md transition-all active:scale-95 text-white uppercase tracking-wider",
                          checkedIn ? "bg-wp-dark" : "bg-wp-blue"
                        )}
                      >
                        {checkingIn ? (
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : checkedIn ? (
                          "Manual Force Out"
                        ) : (
                          "Emergency Check In"
                        )}
                      </button>
                  </div>
                </div>

                {errorStatus && (
                  <motion.div 
                     initial={{ height: 0, opacity: 0 }}
                     animate={{ height: 'auto', opacity: 1 }}
                     className="bg-rose-50 border border-rose-200 p-4 rounded-wp flex items-center gap-3 text-rose-700 shadow-sm"
                  >
                     <ShieldAlert className="w-5 h-5 shrink-0" />
                     <p className="text-xs font-bold uppercase tracking-tight">{errorStatus}</p>
                     <button 
                       onClick={() => setErrorStatus(null)}
                       className="ml-auto text-[10px] font-bold hover:underline"
                     >
                       DISMISS
                     </button>
                  </motion.div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                  <StatCard 
                    title="Total Employees" 
                    value="152" 
                    icon={Users} 
                    trend={12} 
                    trendLabel="+12 this month" 
                  />
                  <StatCard 
                    title="On-Duty Today" 
                    value="122" 
                    icon={CheckCircle2} 
                    trend={1.4} 
                    trendLabel="82.4% Active" 
                  />
                  <StatCard 
                    title="Late Arrivals" 
                    value="04" 
                    icon={Clock} 
                    trend={-5} 
                    trendLabel="Requires Review" 
                  />
                  <StatCard 
                    title="Pending Leaves" 
                    value="07" 
                    icon={Calendar} 
                    trendLabel="Action Needed" 
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Attendance Logs */}
                  <div className="lg:col-span-2 bg-white rounded-wp border border-wp-border shadow-sm flex flex-col">
                    <div className="px-5 py-4 border-b border-wp-border flex justify-between items-center">
                       <h3 className="font-bold text-sm">Recent Attendance Logs</h3>
                       <button className="text-[11px] font-bold text-wp-blue hover:underline uppercase tracking-tight">View All</button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-slate-50 border-b border-wp-border">
                            <th className="px-5 py-3 text-[11px] font-bold text-wp-muted uppercase tracking-wider">Employee</th>
                            <th className="px-5 py-3 text-[11px] font-bold text-wp-muted uppercase tracking-wider">Department</th>
                            <th className="px-5 py-3 text-[11px] font-bold text-wp-muted uppercase tracking-wider">Check-In</th>
                            <th className="px-5 py-3 text-[11px] font-bold text-wp-muted uppercase tracking-wider">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-wp-border">
                          {[
                            { name: 'Marcus Aurelius', dept: 'Strategy', time: '08:45 AM', status: 'IN' },
                            { name: 'Seneca', dept: 'Legal', time: '09:02 AM', status: 'IN' },
                            { name: 'Ada Lovelace', dept: 'Engineering', time: '08:30 AM', status: 'IN' },
                            { name: 'Alan Turing', dept: 'Security', time: '--:--', status: 'ABSENT' },
                            { name: 'Nikola Tesla', dept: 'R&D', time: '09:15 AM', status: 'IN' },
                          ].map((log, i) => (
                            <tr key={i} className="hover:bg-slate-50 transition-colors">
                              <td className="px-5 py-3 text-sm font-semibold">{log.name}</td>
                              <td className="px-5 py-3 text-xs text-wp-muted">{log.dept}</td>
                              <td className="px-5 py-3 text-xs font-mono">{log.time}</td>
                              <td className="px-5 py-3">
                                <span className={cn(
                                  "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                                  log.status === 'IN' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                                )}>
                                  {log.status === 'IN' ? 'CHECKED IN' : 'ABSENT'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Tracking Widget */}
                  <div className="bg-white rounded-wp border border-wp-border shadow-sm flex flex-col h-full overflow-hidden">
                    <div className="px-5 py-4 border-b border-wp-border flex justify-between items-center">
                       <h3 className="font-bold text-sm">Live Geo-Sentinel</h3>
                       <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                          <span className="text-[9px] font-bold text-emerald-600">LIVE SYNC</span>
                       </div>
                    </div>
                    <div className="flex-1 bg-slate-900 relative overflow-hidden min-h-[300px]">
                       <div className="absolute inset-0 opacity-20 bg-[url('https://picsum.photos/seed/darkmap/800/800')] bg-cover grayscale invert focus:none" />
                       <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
                          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                             <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5"/>
                          </pattern>
                          <rect width="100%" height="100%" fill="url(#grid)" />
                       </svg>
                       <div className="absolute inset-0 overflow-hidden pointer-events-none">
                          <div className="w-[200%] h-1 bg-gradient-to-r from-transparent via-wp-blue/30 to-transparent absolute top-0 -translate-y-full animate-[scan_4s_linear_infinite]" style={{ top: '50%' }} />
                       </div>
                       <motion.div 
                          animate={{ x: [0, 50, 20, 0], y: [0, -20, 40, 0] }}
                          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                          className="absolute top-[40%] left-[30%] w-3 h-3 bg-wp-blue border-2 border-white rounded-full shadow-[0_0_15px_rgba(34,113,177,0.8)] z-20"
                       />
                       <motion.div 
                          animate={{ x: [0, -40, 30, 0], y: [0, 60, -10, 0] }}
                          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                          className="absolute top-[60%] left-[70%] w-3 h-3 bg-wp-blue border-2 border-white rounded-full shadow-[0_0_15px_rgba(34,113,177,0.8)] z-20"
                       />
                       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-dashed border-wp-blue/30 rounded-full bg-wp-blue/5 animate-[pulse_3s_ease-in-out_infinite]" />
                       <div className="absolute bottom-3 left-3 bg-wp-dark/80 backdrop-blur-md border border-white/10 px-2 py-1 rounded text-[9px] font-bold uppercase text-slate-300">
                          Primary HQ Perimeter: 200m
                       </div>
                    </div>
                  </div>
                </div>

                {/* Additional Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   <div className="bg-white p-5 rounded-wp border border-wp-border shadow-sm flex flex-col h-full">
                      <h3 className="font-bold text-sm mb-4">Weekly Attendance Trend</h3>
                      <div className="h-40 flex items-end gap-2 px-4">
                         {[70, 85, 90, 65, 80, 40, 30].map((h, i) => (
                           <div key={i} className={cn("flex-1 bg-wp-blue rounded-t transition-all", i > 4 ? "opacity-30" : "opacity-70") } style={{ height: `${h}%` }} />
                         ))}
                      </div>
                   </div>
                   
                   <div className="bg-white rounded-wp border border-wp-border shadow-sm flex flex-col h-full overflow-hidden">
                      <div className="px-5 py-4 border-b border-wp-border flex justify-between items-center bg-rose-50/30">
                         <h3 className="font-bold text-sm text-wp-dark">Recent Fraud Alerts</h3>
                         <div className="flex items-center gap-1.5 ring-1 ring-rose-200 px-2 py-0.5 rounded-full bg-white">
                            <ShieldAlert className="w-3 h-3 text-rose-500" />
                            <span className="text-[9px] font-bold text-rose-600 uppercase">Live Watch</span>
                         </div>
                      </div>
                      <div className="flex-1 p-0 divide-y divide-wp-border overflow-y-auto max-h-[160px]">
                         {[
                           { user: 'Marcus Aurelius', reason: 'GPS Deviation > 500m', time: '10m ago', risk: 'HIGH' },
                           { user: 'Seneca', reason: 'Device Fingerprint Mismatch', time: '1h ago', risk: 'MED' },
                         ].map((f, i) => (
                           <div key={i} className="px-4 py-3 flex items-start gap-3 hover:bg-rose-50/20 transition-colors">
                              <div className={cn(
                                "w-1.5 h-1.5 rounded-full mt-1.5 shrink-0",
                                f.risk === 'HIGH' ? "bg-rose-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]" : "bg-orange-500"
                              )} />
                              <div className="min-w-0">
                                 <p className="text-xs font-bold truncate">{f.user}</p>
                                 <p className="text-[10px] text-wp-muted truncate">{f.reason}</p>
                              </div>
                              <span className="ml-auto text-[9px] font-bold text-wp-muted shrink-0">{f.time}</span>
                           </div>
                         ))}
                      </div>
                   </div>

                   <div className="bg-white p-5 rounded-wp border border-wp-border shadow-sm flex flex-col h-full">
                      <h3 className="font-bold text-sm mb-4">System Integrity</h3>
                      <div className="space-y-3 text-sm">
                         <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                            <span className="text-wp-muted">API Sync Status</span>
                            <span className="text-emerald-600 font-bold">Operational</span>
                         </div>
                         <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                            <span className="text-wp-muted">DB Optimizations</span>
                            <span className="text-wp-text">2h ago</span>
                         </div>
                         <div className="flex justify-between items-center">
                            <span className="text-wp-muted">PWA Connectivity</span>
                            <span className="text-emerald-600 font-bold">Syncing</span>
                         </div>
                      </div>
                   </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'fraud' && (
              <motion.div 
                key="fraud"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center bg-white p-4 rounded-wp border border-wp-border">
                   <div>
                      <h1 className="text-xl font-bold font-serif text-wp-dark">Sentinel AI Fraud Detection</h1>
                      <p className="text-xs text-wp-muted uppercase font-bold tracking-wider">Algorithmic Integrity Audit</p>
                   </div>
                </div>
                <FraudDetection />
              </motion.div>
            )}

            {activeTab === 'tracking' && (
              <motion.div 
                key="tracking"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  <div className="lg:col-span-3 bg-white rounded-wp border border-wp-border shadow-sm h-[600px] relative overflow-hidden">
                    <div className="absolute inset-0 bg-slate-100 bg-[url('https://picsum.photos/seed/fullmap/1200/800')] bg-cover opacity-40" />
                    <div className="absolute inset-0 flex items-center justify-center">
                       <div className="text-center bg-white/90 backdrop-blur-sm p-4 rounded-wp border border-wp-border shadow-xl">
                          <MapPin className="w-8 h-8 text-wp-blue mx-auto mb-2 animate-bounce" />
                          <p className="font-bold text-sm">Interactive GPS Overlay</p>
                          <p className="text-xs text-wp-muted">Live fleet sync enabled</p>
                       </div>
                    </div>
                    {/* Floating Map Controls */}
                    <div className="absolute top-4 right-4 space-y-2">
                       <button className="w-10 h-10 bg-white rounded-wp border border-wp-border shadow-sm flex items-center justify-center font-bold text-lg">+</button>
                       <button className="w-10 h-10 bg-white rounded-wp border border-wp-border shadow-sm flex items-center justify-center font-bold text-lg">-</button>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-wp border border-wp-border shadow-sm flex flex-col">
                    <div className="p-4 border-b border-wp-border">
                       <h3 className="font-bold text-sm uppercase tracking-tight">Active In Field</h3>
                       <p className="text-[10px] text-emerald-600 font-bold">12 USERS ONLINE</p>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                       {[
                         { name: 'Marcus Aurelius', loc: 'Downtown HQ', status: 'Stable', history: [
                            { time: '10:15 AM', loc: 'West Madison St', lat: 34.0522, lng: -118.2437 },
                            { time: '09:45 AM', loc: 'South Grand Ave', lat: 34.0530, lng: -118.2450 },
                            { time: '09:00 AM', loc: 'Central Office', lat: 34.0522, lng: -118.2437 },
                         ]},
                         { name: 'Seneca', loc: 'West Annex', status: 'Moving', history: [
                            { time: '10:30 AM', loc: 'Beverly Hills', lat: 34.0736, lng: -118.4004 },
                            { time: '09:50 AM', loc: 'Culver City', lat: 34.0211, lng: -118.3965 },
                         ]},
                         { name: 'Ada Lovelace', loc: 'Cloud Center', status: 'Stable', history: [
                           { time: '08:30 AM', loc: 'Data Hub 1', lat: 34.0522, lng: -118.2437 }
                         ]},
                         { name: 'Nikola Tesla', loc: 'Laboratory', status: 'Static', history: [
                           { time: '07:00 AM', loc: 'Outer Rim Lab', lat: 34.1000, lng: -118.3000 }
                         ]},
                       ].map((u, i) => (
                         <div 
                           key={i} 
                           onClick={() => setSelectedTrackingUser(u)}
                           className={cn(
                             "flex items-center gap-3 p-2 hover:bg-slate-50 rounded-wp border transition-all cursor-pointer",
                             selectedTrackingUser?.name === u.name ? "border-wp-blue bg-blue-50/30" : "border-transparent hover:border-wp-border"
                           )}
                         >
                            <div className="w-8 h-8 rounded bg-slate-100 shrink-0 overflow-hidden">
                               <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name}`} alt="av" />
                            </div>
                            <div className="min-w-0">
                               <p className="text-xs font-bold truncate">{u.name}</p>
                               <p className="text-[10px] text-wp-muted font-mono">{u.loc}</p>
                            </div>
                            <div className="ml-auto w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                         </div>
                       ))}
                    </div>

                    {selectedTrackingUser && (
                      <div className="p-4 bg-slate-50 border-t border-wp-border max-h-[250px] overflow-y-auto">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="text-[11px] font-bold uppercase text-wp-muted">Location History</h4>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setSelectedTrackingUser(null); }}
                            className="text-[10px] font-bold text-rose-600 hover:underline"
                          >
                            CLEAR
                          </button>
                        </div>
                        <div className="space-y-4 relative before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                          {selectedTrackingUser.history.map((h: any, idx: number) => (
                            <div key={idx} className="relative pl-5">
                              <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-white border-2 border-wp-blue z-10" />
                              <p className="text-[11px] font-bold text-wp-text">{h.loc}</p>
                              <div className="flex justify-between items-center mt-0.5">
                                <span className="text-[10px] text-wp-muted font-mono">{h.time}</span>
                                <span className="text-[9px] text-wp-muted opacity-60">{h.lat.toFixed(4)}, {h.lng.toFixed(4)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'leaves' && (
              <motion.div 
                key="leaves"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center mb-6">
                   <h1 className="text-xl font-bold text-wp-text">Leave Management</h1>
                   <div className="flex gap-2">
                      <button className="px-3 py-1.5 bg-white border border-wp-border rounded-wp text-[11px] font-bold uppercase">Pending</button>
                      <button className="px-3 py-1.5 bg-slate-50 border border-wp-border rounded-wp text-[11px] font-bold uppercase text-wp-muted">Approved</button>
                   </div>
                </div>

                <div className="bg-white rounded-wp border border-wp-border shadow-sm overflow-hidden">
                   <table className="w-full text-left">
                      <thead>
                         <tr className="bg-slate-50 border-b border-wp-border">
                            <th className="px-5 py-3 text-[11px] font-bold text-wp-muted uppercase tracking-wider">Employee</th>
                            <th className="px-5 py-3 text-[11px] font-bold text-wp-muted uppercase tracking-wider">Type</th>
                            <th className="px-5 py-3 text-[11px] font-bold text-wp-muted uppercase tracking-wider">Duration</th>
                            <th className="px-5 py-3 text-[11px] font-bold text-wp-muted uppercase tracking-wider">Reason</th>
                            <th className="px-5 py-3 text-[11px] font-bold text-wp-muted uppercase tracking-wider">Status</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-wp-border">
                         {[
                           { name: 'Alan Turing', type: 'Medical', days: '3 Days', reason: 'Flu Recovery', status: 'Pending' },
                           { name: 'Grace Hopper', type: 'Vacation', days: '5 Days', reason: 'Family Trip', status: 'Approved' },
                           { name: 'Linus Torvalds', type: 'Personal', days: '1 Day', reason: 'Private Matter', status: 'Pending' },
                         ].map((l, i) => (
                           <tr key={i} className="hover:bg-slate-50/50">
                              <td className="px-5 py-3 text-sm font-bold">{l.name}</td>
                              <td className="px-5 py-3 text-xs font-semibold">{l.type}</td>
                              <td className="px-5 py-3 text-xs font-bold text-wp-blue">{l.days}</td>
                              <td className="px-5 py-3 text-xs text-wp-muted italic">"{l.reason}"</td>
                              <td className="px-5 py-3">
                                 <div className="flex gap-2 font-bold text-[10px]">
                                    <button className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded">APPROVE</button>
                                    <button className="px-2 py-0.5 bg-rose-50 text-rose-600 rounded">REJECT</button>
                                 </div>
                              </td>
                           </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'attendance' && (
              <motion.div 
                key="attendance"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center mb-6">
                   <div>
                      <h1 className="text-xl font-bold text-wp-text font-serif">Attendance Intelligence</h1>
                      <p className="text-[10px] font-bold text-wp-muted uppercase tracking-widest">Enterprise Log Registry</p>
                   </div>
                   <div className="flex gap-3">
                      <button className="flex items-center gap-2 px-4 py-2 bg-white border border-wp-border rounded-wp text-xs font-bold hover:bg-slate-50 transition-all">
                         <Download className="w-3.5 h-3.5" /> EXPORT PDF
                      </button>
                      <button className="flex items-center gap-2 px-4 py-2 bg-wp-blue text-white rounded-wp text-xs font-bold shadow-md active:scale-95 transition-all">
                         <UserCheck className="w-3.5 h-3.5" /> BULK VERIFY
                      </button>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                   <div className="bg-white p-4 rounded-wp border border-wp-border shadow-sm">
                      <p className="text-[10px] font-bold text-wp-muted uppercase mb-1">On-Time Arrival</p>
                      <p className="text-xl font-bold text-emerald-600">94.2%</p>
                   </div>
                   <div className="bg-white p-4 rounded-wp border border-wp-border shadow-sm">
                      <p className="text-[10px] font-bold text-wp-muted uppercase mb-1">Late Counter</p>
                      <p className="text-xl font-bold text-amber-500">08</p>
                   </div>
                   <div className="bg-white p-4 rounded-wp border border-wp-border shadow-sm">
                      <p className="text-[10px] font-bold text-wp-muted uppercase mb-1">Avg Check-In</p>
                      <p className="text-xl font-bold text-wp-text">08:42 AM</p>
                   </div>
                   <div className="bg-white p-4 rounded-wp border border-wp-border shadow-sm">
                      <p className="text-[10px] font-bold text-wp-muted uppercase mb-1">Device Conflict</p>
                      <p className="text-xl font-bold text-rose-500">02</p>
                   </div>
                </div>

                <div className="bg-white rounded-wp border border-wp-border shadow-sm overflow-hidden">
                   <div className="p-4 border-b border-wp-border bg-slate-50/50 flex justify-between items-center">
                      <h2 className="text-xs font-bold uppercase tracking-tight text-wp-muted">Live Attendance Stream</h2>
                      <div className="flex gap-2 text-[10px] font-bold">
                         <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500" /> GPS VERIFIED</span>
                         <span className="flex items-center gap-1 text-wp-muted"><div className="w-2 h-2 rounded-full bg-slate-300" /> MANUAL</span>
                      </div>
                   </div>
                   <table className="w-full text-left">
                      <thead>
                         <tr className="bg-slate-50/30 border-b border-wp-border text-[10px] font-bold text-wp-muted uppercase tracking-wider">
                            <th className="px-5 py-3">Employee</th>
                            <th className="px-5 py-3 text-center">Check-In</th>
                            <th className="px-5 py-3 text-center">Check-Out</th>
                            <th className="px-5 py-3">Device ID</th>
                            <th className="px-5 py-3">GPS Confidence</th>
                            <th className="px-5 py-3">Actions</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-wp-border">
                         {[
                            { name: 'Ada Lovelace', in: '08:30:12', out: '17:05:44', device: 'SENT-X992', gps: '99%', status: 'late' },
                            { name: 'Marcus Aurelius', in: '08:45:00', out: '--:--:--', device: 'SENT-P441', gps: '98%', status: 'on-time' },
                            { name: 'Seneca', in: '09:02:15', out: '--:--:--', device: 'SENT-L001', gps: '82%', status: 'late' },
                            { name: 'Nikola Tesla', in: '09:15:33', out: '--:--:--', device: 'SENT-T882', gps: '100%', status: 'on-time' },
                         ].map((l, i) => (
                            <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                               <td className="px-5 py-3 flex items-center gap-3">
                                  <div className="w-6 h-6 rounded bg-slate-100 overflow-hidden">
                                     <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${l.name}`} alt="av" />
                                  </div>
                                  <span className="text-sm font-bold">{l.name}</span>
                               </td>
                               <td className="px-5 py-3 text-center">
                                  <div className="flex flex-col">
                                     <span className="text-xs font-mono font-bold">{l.in}</span>
                                     <span className="text-[9px] text-wp-muted">SENT-AUTO</span>
                                  </div>
                               </td>
                               <td className="px-5 py-3 text-center text-xs font-mono text-wp-muted">{l.out}</td>
                               <td className="px-5 py-3 text-[10px] font-mono font-bold text-wp-muted">{l.device}</td>
                               <td className="px-5 py-3">
                                  <div className="flex items-center gap-2">
                                     <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-wp-blue" style={{ width: l.gps }} />
                                     </div>
                                     <span className="text-[10px] font-bold">{l.gps}</span>
                                  </div>
                               </td>
                               <td className="px-5 py-3">
                                  <button className="p-1.5 hover:bg-slate-100 rounded-wp text-wp-muted transition-all">
                                     <Settings className="w-3.5 h-3.5" />
                                  </button>
                               </td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'analytics' && (
              <motion.div 
                key="analytics"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center bg-white p-5 rounded-wp border border-wp-border shadow-sm">
                   <div>
                      <h1 className="text-xl font-bold font-serif">Performance Analytics</h1>
                      <p className="text-[10px] font-bold text-wp-muted uppercase tracking-widest">Statistical System Audit</p>
                   </div>
                   <div className="flex gap-2">
                      <select className="bg-slate-50 border border-wp-border rounded-wp px-3 py-1.5 text-xs font-bold outline-none">
                         <option>Last 30 Days</option>
                         <option>Last Quarter</option>
                         <option>Current Year</option>
                      </select>
                   </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                   <div className="bg-white p-6 rounded-wp border border-wp-border shadow-sm h-[350px] flex flex-col">
                      <h3 className="font-bold text-xs uppercase text-wp-muted mb-6">Attendance Trend (Daily Average)</h3>
                      <ResponsiveContainer width="100%" height="100%">
                         <AreaChart data={ATTENDANCE_DATA}>
                            <defs>
                               <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#2271b1" stopOpacity={0.1}/>
                                  <stop offset="95%" stopColor="#2271b1" stopOpacity={0}/>
                               </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                            <Tooltip 
                               contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                               itemStyle={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                               labelStyle={{ color: '#94a3b8', fontSize: '10px', marginBottom: '4px' }}
                            />
                            <Area type="monotone" dataKey="present" stroke="#2271b1" fillOpacity={1} fill="url(#colorPresent)" strokeWidth={2} />
                         </AreaChart>
                      </ResponsiveContainer>
                   </div>

                   <div className="bg-white p-6 rounded-wp border border-wp-border shadow-sm h-[350px] flex flex-col">
                      <h3 className="font-bold text-xs uppercase text-wp-muted mb-6">Late frequency by Department</h3>
                      <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={[
                            { dept: 'Eng', late: 12, ontime: 88 },
                            { dept: 'Sales', late: 25, ontime: 75 },
                            { dept: 'HR', late: 5, ontime: 95 },
                            { dept: 'Legal', late: 2, ontime: 98 },
                            { dept: 'Mkt', late: 18, ontime: 82 },
                         ]}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="dept" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                            <Tooltip 
                               cursor={{ fill: '#f8fafc' }}
                               contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                               itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                            />
                            <Bar dataKey="late" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={30} />
                            <Bar dataKey="ontime" stackId="a" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={30} />
                         </BarChart>
                      </ResponsiveContainer>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div className="bg-white p-5 rounded-wp border border-wp-border shadow-sm">
                      <Activity className="w-5 h-5 text-wp-blue mb-3" />
                      <h4 className="font-bold text-sm mb-1">Efficiency Score</h4>
                      <p className="text-2xl font-bold">8.4<span className="text-xs text-wp-muted font-normal ml-1">/ 10</span></p>
                      <p className="text-[10px] text-emerald-600 font-bold mt-2">+0.5% from last month</p>
                   </div>
                   <div className="bg-white p-5 rounded-wp border border-wp-border shadow-sm">
                      <AlertCircle className="w-5 h-5 text-amber-500 mb-3" />
                      <h4 className="font-bold text-sm mb-1">Absence Index</h4>
                      <p className="text-2xl font-bold">2.1%</p>
                      <p className="text-[10px] text-emerald-600 font-bold mt-2">Below industry average</p>
                   </div>
                   <div className="bg-white p-5 rounded-wp border border-wp-border shadow-sm">
                      <Brain className="w-5 h-5 text-wp-blue mb-3" />
                      <h4 className="font-bold text-sm mb-1">AI Correction Rate</h4>
                      <p className="text-2xl font-bold">99.8%</p>
                      <p className="text-[10px] text-wp-muted font-bold mt-2">Sentinel Engine Accuracy</p>
                   </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'roles' && (
              <motion.div 
                key="roles"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center bg-white p-5 rounded-wp border border-wp-border">
                   <div>
                      <h1 className="text-xl font-bold font-serif">Security & Permissions</h1>
                      <p className="text-[10px] font-bold text-wp-muted uppercase tracking-widest">Role-Based Access Control</p>
                   </div>
                   <button className="flex items-center gap-2 px-4 py-2 bg-wp-blue text-white rounded-wp text-xs font-bold shadow-md active:scale-95 transition-all">
                      <UserPlus className="w-3.5 h-3.5" /> CREATE NEW ROLE
                   </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   {[
                      { name: 'Global Administrator', users: 2, color: 'bg-wp-blue', desk: 'Full system access, all modules enabled.' },
                      { name: 'HR Manager', users: 5, color: 'bg-emerald-500', desk: 'Employee and Attendance management only.' },
                      { name: 'Department Head', users: 12, color: 'bg-amber-500', desk: 'Tracking and localized reports for team.' },
                   ].map((role, i) => (
                      <div key={i} className="bg-white p-6 rounded-wp border border-wp-border shadow-sm flex flex-col">
                         <div className="flex justify-between items-start mb-4">
                            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-white", role.color)}>
                               <Lock className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-bold text-wp-muted uppercase bg-slate-50 px-2 py-1 rounded">Active</span>
                         </div>
                         <h3 className="font-bold text-sm mb-1">{role.name}</h3>
                         <p className="text-[10px] text-wp-muted mb-4 uppercase font-bold">{role.users} ASSIGNED USERS</p>
                         <p className="text-xs text-wp-muted leading-relaxed mb-6">{role.desk}</p>
                         <div className="mt-auto pt-4 border-t border-wp-border flex justify-between items-center">
                            <button className="text-[10px] font-bold text-wp-blue hover:underline uppercase tracking-tight">Modify Permissions</button>
                            <ChevronRight className="w-4 h-4 text-wp-muted" />
                         </div>
                      </div>
                   ))}
                </div>

                <div className="bg-white rounded-wp border border-wp-border shadow-sm overflow-hidden">
                   <div className="p-4 border-b border-wp-border bg-slate-50/50">
                      <h2 className="text-xs font-bold uppercase tracking-tight text-wp-muted">Module Permission Matrix</h2>
                   </div>
                   <div className="p-0">
                      <table className="w-full text-left">
                         <thead>
                            <tr className="bg-slate-50/30 border-b border-wp-border text-[10px] font-bold text-wp-muted uppercase tracking-wider">
                               <th className="px-5 py-3">Module</th>
                               <th className="px-5 py-3 text-center">Admin</th>
                               <th className="px-5 py-3 text-center">Manager</th>
                               <th className="px-5 py-3 text-center">Employee</th>
                               <th className="px-5 py-3 text-center">API Client</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-wp-border">
                            {['Dashboard', 'Employees', 'Attendance', 'Tracking', 'Leaves', 'Analytics', 'Settings'].map((mod, i) => (
                               <tr key={i}>
                                  <td className="px-5 py-3 text-sm font-semibold">{mod}</td>
                                  {[1, 2, 3, 4].map(col => (
                                     <td key={col} className="px-5 py-3 text-center">
                                        <input 
                                           type="checkbox" 
                                           defaultChecked={col === 1 || (col === 2 && i < 5) || (col === 3 && i === 0)} 
                                           className="w-4 h-4 rounded-sm border-wp-border text-wp-blue focus:ring-wp-blue"
                                        />
                                     </td>
                                  ))}
                               </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'notifications' && (
              <motion.div 
                key="notifications"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center bg-white p-5 rounded-wp border border-wp-border shadow-sm">
                   <div>
                      <h1 className="text-xl font-bold font-serif text-wp-dark">Notification Center</h1>
                      <p className="text-[10px] font-bold text-wp-muted uppercase tracking-widest">System Alerts & User Triggers</p>
                   </div>
                   <button className="text-xs font-bold text-wp-blue hover:underline">Mark all as read</button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                   <div className="lg:col-span-2 space-y-4">
                      {[
                         { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50', title: 'Late Check-in Detected', user: 'Seneca', time: '12m ago', desk: 'User checked in 15 minutes past scheduled start time.' },
                         { icon: MapPin, color: 'text-rose-500', bg: 'bg-rose-50', title: 'Geofence Breach', user: 'Marcus', time: '1h ago', desk: 'Attempted telemetry sync from unauthorized perimeter (450m deviation).' },
                         { icon: UserCheck, color: 'text-emerald-500', bg: 'bg-emerald-50', title: 'Check-in Verified', user: 'Ada', time: '2h ago', desk: 'System autonomous verification complete for Engineering node.' },
                         { icon: ShieldAlert, color: 'text-rose-500', bg: 'bg-rose-50', title: 'Device Lock Trigger', user: 'Turing', time: '4h ago', desk: 'New device signature detected. Access restricted until admin review.' },
                      ].map((n, i) => (
                         <div key={i} className="bg-white p-4 rounded-wp border border-wp-border shadow-sm flex gap-4 hover:shadow-md transition-all group">
                            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:scale-110", n.bg, n.color)}>
                               <n.icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                               <div className="flex justify-between items-start mb-1">
                                  <h4 className="font-bold text-sm tracking-tight">{n.title}</h4>
                                  <span className="text-[10px] text-wp-muted font-bold whitespace-nowrap">{n.time}</span>
                               </div>
                               <p className="text-xs text-wp-muted mb-2"><span className="font-bold text-wp-text">{n.user}</span> • {n.desk}</p>
                               <div className="flex gap-2">
                                  <button className="text-[10px] font-bold text-wp-blue uppercase">Review</button>
                                  <button className="text-[10px] font-bold text-wp-muted uppercase">Dismiss</button>
                               </div>
                            </div>
                         </div>
                      ))}
                   </div>

                   <div className="space-y-6">
                      <div className="bg-white p-5 rounded-wp border border-wp-border shadow-sm">
                         <h3 className="font-bold text-xs uppercase tracking-tight text-wp-muted mb-4">Alert Configurations</h3>
                         <div className="space-y-4">
                            {[
                               { label: 'Late Arrival Alerts', channel: 'SMS / Push' },
                               { label: 'Unauthorized GPS', channel: 'Admin Dashboard' },
                               { label: 'Leave Requests', channel: 'Email' },
                               { label: 'System Errors', channel: 'Slack Webhook' },
                            ].map((c, i) => (
                               <div key={i} className="flex justify-between items-center">
                                  <p className="text-xs font-bold">{c.label}</p>
                                  <div className="flex items-center gap-2">
                                     <span className="text-[9px] font-bold text-wp-muted uppercase">{c.channel}</span>
                                     <button className="w-8 h-4 bg-wp-blue rounded-full relative">
                                        <div className="absolute top-0.5 right-0.5 w-3 h-3 bg-white rounded-full" />
                                     </button>
                                  </div>
                               </div>
                            ))}
                         </div>
                      </div>
                      
                      <div className="bg-wp-blue p-5 rounded-wp text-white shadow-lg relative overflow-hidden">
                         <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12" />
                         <h3 className="font-bold text-sm mb-1">WhatsApp Bridge</h3>
                         <p className="text-[10px] text-white/70 mb-4 tracking-tight uppercase font-bold">Direct HR-to-Employee comms</p>
                         <button className="w-full bg-white text-wp-blue font-bold py-2 rounded-wp text-xs shadow-md active:scale-95 transition-all">CONFIGURE API</button>
                      </div>
                   </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'api' && (
              <motion.div 
                key="api"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center bg-white p-5 rounded-wp border border-wp-border">
                   <div>
                      <h1 className="text-xl font-bold font-serif">API Controller</h1>
                      <p className="text-[10px] font-bold text-wp-muted uppercase tracking-widest">Telemetry & Integration Gateway</p>
                   </div>
                   <button className="flex items-center gap-2 px-4 py-2 bg-wp-dark text-white rounded-wp text-xs font-bold shadow-md active:scale-95 transition-all">
                      <Code className="w-3.5 h-3.5" /> GENERATE NEW KEY
                   </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div className="md:col-span-2 space-y-6">
                      <div className="bg-white rounded-wp border border-wp-border shadow-sm overflow-hidden">
                         <div className="p-4 border-b border-wp-border bg-slate-50/50">
                            <h2 className="text-xs font-bold uppercase tracking-tight text-wp-muted">Active Access Tokens</h2>
                         </div>
                         <table className="w-full text-left">
                            <thead>
                               <tr className="bg-slate-50/30 border-b border-wp-border text-[10px] font-bold text-wp-muted uppercase tracking-wider">
                                  <th className="px-5 py-3">Client / Use Case</th>
                                  <th className="px-5 py-3">Token Hash</th>
                                  <th className="px-5 py-3">Last Active</th>
                                  <th className="px-5 py-3">Status</th>
                               </tr>
                            </thead>
                            <tbody className="divide-y divide-wp-border">
                               {[
                                  { use: 'PWA Mobile App', hash: '8f92***a2b1', time: 'Active Now', status: 'Live' },
                                  { use: 'External HR Sync', hash: 'c0e1***f99d', time: '12h ago', status: 'Standby' },
                                  { use: 'Field Sentinel Hub', hash: '44a3***88e2', time: 'Active Now', status: 'Live' },
                               ].map((k, i) => (
                                  <tr key={i}>
                                     <td className="px-5 py-3 text-sm font-bold">{k.use}</td>
                                     <td className="px-5 py-3 text-xs font-mono text-wp-muted">{k.hash}</td>
                                     <td className="px-5 py-3 text-[10px] font-bold uppercase text-wp-muted">{k.time}</td>
                                     <td className="px-5 py-3">
                                        <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{k.status}</span>
                                     </td>
                                  </tr>
                               ))}
                            </tbody>
                         </table>
                      </div>

                      <div className="bg-white rounded-wp border border-wp-border shadow-sm overflow-hidden">
                         <div className="p-4 border-b border-wp-border bg-slate-50/50">
                            <h2 className="text-xs font-bold uppercase tracking-tight text-wp-muted">Recent API Logs (REST v2)</h2>
                         </div>
                         <div className="p-0 max-h-[300px] overflow-y-auto">
                            <table className="w-full text-left border-collapse">
                               <tbody className="divide-y divide-wp-border">
                                  {[
                                     { method: 'POST', path: '/v2/telemetry/sync', code: 201, time: '14:22:11', user: 'Sentinel-01' },
                                     { method: 'GET', path: '/v2/attendance/status', code: 200, time: '14:22:05', user: 'Mobile-App' },
                                     { method: 'POST', path: '/v2/auth/verify', code: 200, time: '14:21:55', user: 'Field-Hub' },
                                     { method: 'POST', path: '/v2/telemetry/sync', code: 403, time: '14:21:44', user: 'Sentinel-01' },
                                     { method: 'GET', path: '/v2/leaves/pending', code: 200, time: '14:20:30', user: 'Admin-Browser' },
                                  ].map((log, i) => (
                                     <tr key={i} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-5 py-2">
                                           <span className={cn(
                                              "text-[9px] font-bold px-1.5 py-0.5 rounded",
                                              log.method === 'POST' ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                                           )}>{log.method}</span>
                                        </td>
                                        <td className="px-5 py-2 text-[10px] font-mono font-bold tracking-tight">{log.path}</td>
                                        <td className="px-5 py-2 text-[10px] font-bold whitespace-nowrap">{log.time}</td>
                                        <td className="px-5 py-2 shrink-0">
                                           <span className={cn(
                                              "text-[9px] font-bold px-1.5 py-0.5 rounded-full",
                                              log.code === 200 || log.code === 201 ? "text-emerald-600" : "text-rose-600 bg-rose-50"
                                           )}>{log.code}</span>
                                        </td>
                                     </tr>
                                  ))}
                               </tbody>
                            </table>
                         </div>
                      </div>
                   </div>

                   <div className="space-y-6">
                      <div className="bg-wp-dark p-5 rounded-wp border border-slate-800 text-white shadow-xl">
                         <h3 className="font-bold text-xs uppercase tracking-tight text-wp-muted mb-4">Connectivity Health</h3>
                         <div className="space-y-4">
                            <div className="flex justify-between items-center">
                               <span className="text-xs">REST Server</span>
                               <span className="text-xs text-emerald-500 font-bold">ONLINE</span>
                            </div>
                            <div className="flex justify-between items-center">
                               <span className="text-xs">WebSocket Hub</span>
                               <span className="text-xs text-wp-blue font-bold">12 CONNECTED</span>
                            </div>
                            <div className="flex justify-between items-center">
                               <span className="text-xs">DB Connection</span>
                               <span className="text-xs text-emerald-500 font-bold">STABLE</span>
                            </div>
                         </div>
                         <div className="mt-6 pt-6 border-t border-slate-800">
                            <p className="text-[10px] text-wp-muted uppercase font-bold mb-3">Average Latency</p>
                            <p className="text-2xl font-bold font-mono">22ms</p>
                         </div>
                      </div>

                      <div className="bg-white p-5 rounded-wp border border-wp-border shadow-sm border-l-4 border-l-wp-blue">
                         <h3 className="font-bold text-sm mb-1 uppercase tracking-tight">API Documentation</h3>
                         <p className="text-xs text-wp-muted mb-4">Access our full swagger documentation for third-party ERP integrations.</p>
                         <button className="text-[11px] font-bold text-wp-blue hover:underline">OPEN SWAGGER UI</button>
                      </div>
                   </div>
                </div>
              </motion.div>
            )}

            {activeTab === "settings" && (
              <motion.div 
                key="settings"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <div className="max-w-3xl bg-white rounded-wp border border-wp-border shadow-sm">
                   <div className="p-6 border-b border-wp-border">
                      <h3 className="font-bold text-lg">General Settings</h3>
                      <p className="text-xs text-wp-muted capitalize">Configure IG-ERP global parameters</p>
                   </div>
                   <div className="p-6 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="space-y-2">
                            <label className="text-[11px] font-bold text-wp-muted uppercase">Office Latitude</label>
                            <input type="number" value={officeLat} onChange={(e) => setOfficeLat(Number(e.target.value))} className="w-full bg-slate-50 border border-wp-border rounded-wp px-3 py-2 text-sm focus:ring-1 focus:ring-wp-blue outline-none" />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[11px] font-bold text-wp-muted uppercase">Office Longitude</label>
                            <input type="number" value={officeLng} onChange={(e) => setOfficeLng(Number(e.target.value))} className="w-full bg-slate-50 border border-wp-border rounded-wp px-3 py-2 text-sm focus:ring-1 focus:ring-wp-blue outline-none" />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[11px] font-bold text-wp-muted uppercase">Geofence Radius (Meters)</label>
                            <input type="number" value={geofenceRadius} onChange={(e) => setGeofenceRadius(Number(e.target.value))} className="w-full bg-slate-50 border border-wp-border rounded-wp px-3 py-2 text-sm focus:ring-1 focus:ring-wp-blue outline-none" />
                         </div>
                         <div className="space-y-2 flex flex-col justify-end">
                            <div className="flex items-center gap-2 mb-3">
                               <input type="checkbox" defaultChecked className="w-4 h-4" />
                               <span className="text-xs font-bold text-wp-text uppercase">Enable AI Auditing</span>
                            </div>
                         </div>
                      </div>

                      <div className="pt-6 border-t border-wp-border flex justify-end">
                         <button className="px-6 py-2 bg-wp-blue text-white rounded-wp font-bold text-sm shadow-md hover:shadow-lg active:scale-95 transition-all">SAVE CONFIGURATION</button>
                      </div>
                   </div>
                </div>

                <div className="max-w-3xl bg-wp-dark p-6 rounded-wp border border-slate-800 text-white flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="p-3 bg-white/5 rounded-full">
                         <Download className="w-6 h-6 text-wp-blue" />
                      </div>
                      <div>
                         <p className="font-bold text-sm">System Backup</p>
                         <p className="text-[10px] text-slate-400 capitalize">Last backup generated 24 hours ago</p>
                      </div>
                   </div>
                   <button className="text-[11px] font-bold underline hover:text-wp-blue">DOWNLOAD RECOVERY KEY</button>
                </div>
              </motion.div>
            )}

            {activeTab === 'employees' && (
              <motion.div 
                key="employees"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                 <div className="flex justify-between items-center bg-white p-4 rounded-wp border border-wp-border">
                    <div className="flex-1 max-w-sm">
                      <input type="text" placeholder="Search..." className="w-full bg-slate-50 border border-wp-border rounded-wp px-3 py-2 text-sm focus:ring-1 focus:ring-wp-blue outline-none" />
                    </div>
                    <button className="bg-wp-blue text-white px-4 py-2 rounded-wp font-bold text-xs flex items-center gap-2">
                       <UserPlus className="w-3.5 h-3.5" /> ADD NEW
                    </button>
                 </div>

                 <div className="bg-white rounded-wp border border-wp-border overflow-hidden">
                    <table className="w-full text-left">
                       <thead>
                          <tr className="bg-slate-50 border-b border-wp-border">
                             <th className="px-5 py-3 text-[11px] font-bold text-wp-muted uppercase tracking-wider">Employee</th>
                             <th className="px-5 py-3 text-[11px] font-bold text-wp-muted uppercase tracking-wider">Department</th>
                             <th className="px-5 py-3 text-[11px] font-bold text-wp-muted uppercase tracking-wider">Position</th>
                             <th className="px-5 py-3 text-[11px] font-bold text-wp-muted uppercase tracking-wider">Actions</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-wp-border">
                          {[
                            { name: 'Marcus Aurelius', dept: 'Headquarters', pos: 'Stoic Strategist' },
                            { name: 'Lucius Seneca', dept: 'Legal', pos: 'General Counsel' },
                            { name: 'Epictetus', dept: 'Education', pos: 'Senior Consultant' },
                            { name: 'Zeno', dept: 'Founder', pos: 'Chief Visionary' },
                          ].map((emp, i) => (
                            <tr key={i} className="hover:bg-slate-50 transition-colors">
                               <td className="px-5 py-3">
                                  <div className="flex items-center gap-3">
                                     <div className="w-7 h-7 rounded-sm bg-slate-200 overflow-hidden">
                                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${emp.name}`} alt="avatar" />
                                     </div>
                                     <span className="text-sm font-bold">{emp.name}</span>
                                  </div>
                               </td>
                               <td className="px-5 py-3 text-xs text-wp-muted">{emp.dept}</td>
                               <td className="px-5 py-3 text-xs italic">{emp.pos}</td>
                               <td className="px-5 py-3">
                                  <button className="text-[11px] font-bold text-wp-blue">EDIT</button>
                               </td>
                            </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Floating Preview Switcher (Visual only) */}
      <div className="fixed bottom-6 right-6 flex gap-2 p-3 bg-white rounded-wp shadow-2xl border border-wp-border z-[60]">
         <div className="p-1 px-2 bg-emerald-50 rounded">
           <span className="text-[10px] font-bold text-emerald-600">v1.2.4</span>
         </div>
         <div className="pr-4 border-l border-wp-border pl-3">
           <p className="text-xs font-bold uppercase tracking-tight">System Status</p>
           <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">ALL NODES ACTIVE</p>
         </div>
      </div>
    </div>
  );
}



import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Circle, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { format, parseISO, isValid } from 'date-fns';
import { 
  Clock, 
  MapPin, 
  UserCheck, 
  UserX, 
  ShieldAlert, 
  Navigation,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Briefcase,
  Building2,
  Save,
  CalendarDays,
  FileBadge,
  SendHorizontal,
  Users2,
  Plus,
  Trash2,
  Settings,
  UserPlus,
  Pencil
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

// Fix for default marker icons using CDN URLs to avoid build issues
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface EmployeeDashboardProps {
  officeLat: number;
  officeLng: number;
  geofenceRadius: number;
}

// Helper to keep map centered on user
const MapRecenter = ({ lat, lng }: { lat: number, lng: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng]);
  }, [lat, lng, map]);
  return null;
};

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ 
  officeLat, 
  officeLng, 
  geofenceRadius 
}) => {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [checkedIn, setCheckedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Profile State
  const [profile, setProfile] = useState({
    phone: '',
    department: '',
    position: '',
    isManager: false,
    role: 'employee' as 'admin' | 'hr' | 'employee'
  });

  const [teamLeaves, setTeamLeaves] = useState<Array<{ name: string, type: string }>>([]);
  const [leaveForm, setLeaveForm] = useState({
    type: 'medical',
    start: '',
    end: '',
    reason: ''
  });

  const [myLeaves, setMyLeaves] = useState<Array<{ id: number, type: string, start: string, end: string, reason: string, status: string, userName?: string }>>([]);
  const [leaveTypes, setLeaveTypes] = useState<Array<{ id: number, name: string, description: string }>>([]);
  const [loadingLeave, setLoadingLeave] = useState(false);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [newLeaveType, setNewLeaveType] = useState({ name: '', description: '' });
  const [loadingAdmin, setLoadingAdmin] = useState(false);

  const [showStaffPanel, setShowStaffPanel] = useState(false);
  const [allEmployees, setAllEmployees] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [allShifts, setAllShifts] = useState<any[]>([]);
  const [editingEmployee, setEditingEmployee] = useState<any | null>(null);
  const [loadingStaff, setLoadingStaff] = useState(false);

  const [logs, setLogs] = useState<Array<{ type: string, time: string, device: string, accuracy?: number }>>([
    { type: 'Node Standby', time: new Date().toLocaleTimeString(), device: 'SENT-X1' }
  ]);

  // Haversine
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  useEffect(() => {
    const clockTimer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    // Fetch Initial Profile
    const fetchProfile = async () => {
      try {
        const formData = new URLSearchParams();
        formData.append('action', 'ig_erp_get_self_profile');
        formData.append('nonce', (window as any).ig_erp?.nonce || '');

        const response = await fetch((window as any).ig_erp?.ajax_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
        if (result.success) {
          setProfile({
            phone: result.data.phone || '',
            department: result.data.department || '',
            position: result.data.position || '',
            isManager: !!result.data.is_manager,
            role: result.data.role || 'employee'
          });
        }
      } catch (e) {
        console.error("Profile fetch error:", e);
      }
    };

    const fetchLeaves = async () => {
      try {
        const formData = new URLSearchParams();
        formData.append('action', 'ig_erp_get_self_leaves');
        formData.append('nonce', (window as any).ig_erp?.nonce || '');

        const response = await fetch((window as any).ig_erp?.ajax_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
        if (result.success) {
          setMyLeaves(result.data.map((l: any) => ({
            id: l.id,
            type: l.leave_type,
            start: l.start_date,
            end: l.end_date,
            reason: l.reason,
            status: l.status,
            userName: l.user_name
          })));
        }
      } catch (e) {
        console.error("Leaves fetch error:", e);
      }
    };

    const fetchLeaveTypes = async () => {
      try {
        const formData = new URLSearchParams();
        formData.append('action', 'ig_erp_get_leave_types');
        formData.append('nonce', (window as any).ig_erp?.nonce || '');

        const response = await fetch((window as any).ig_erp?.ajax_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData
        });
        const result = await response.json();
        if (result.success) {
          setLeaveTypes(result.data);
          if (result.data.length > 0 && !leaveForm.type) {
            setLeaveForm(f => ({ ...f, type: result.data[0].name }));
          }
        }
      } catch (err) {
        console.error('Error fetching leave types:', err);
      }
    };

    const fetchStaffData = async () => {
      if (profile.role !== 'admin' && profile.role !== 'hr') return;
      try {
        const formData = new URLSearchParams();
        formData.append('action', 'ig_erp_get_all_employees');
        formData.append('nonce', (window as any).ig_erp?.nonce || '');

        const response = await fetch((window as any).ig_erp?.ajax_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData
        });
        const result = await response.json();
        if (result.success) {
          setAllEmployees(result.data.employees);
          setAllShifts(result.data.shifts);
          setAllUsers(result.data.users);
        }
      } catch (err) {
        console.error('Error fetching staff data:', err);
      }
    };

    fetchProfile();
    fetchLeaves();
    fetchLeaveTypes();
    fetchStaffData();

    let watchId: number;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, accuracy: acc } = pos.coords;
          setUserLocation([latitude, longitude]);
          setAccuracy(acc);
          const d = calculateDistance(latitude, longitude, officeLat, officeLng);
          setDistance(d);
        },
        (err) => console.error(err),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }

    return () => {
      clearInterval(clockTimer);
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [officeLat, officeLng]);

  const handleAttendance = async (type: 'in' | 'out') => {
    if (!userLocation) return;
    setLoading(true);
    
    const payload = {
      action: type === 'in' ? 'ig_erp_check_in' : 'ig_erp_check_out',
      lat: userLocation[0],
      lng: userLocation[1],
      accuracy: accuracy,
      device_id: 'SENT-X1'
    };

    console.log(`Sending Sentinel Telemetry (${type}):`, payload);

    try {
      // In a real WP environment, we'd use:
      // const response = await fetch((window as any).ig_erp.ajax_url, { 
      //   method: 'POST', 
      //   body: new URLSearchParams({...payload, nonce: (window as any).ig_erp.nonce}) 
      // });
      // const result = await response.json();
      
      // Simulating a network delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      setCheckedIn(type === 'in');
      setLogs(prev => [{
        type: type === 'in' ? 'Check-In Success' : 'Check-Out Success',
        time: new Date().toLocaleTimeString(),
        device: 'SENT-X1',
        accuracy: accuracy || undefined
      }, ...prev]);

    } catch (error) {
       console.error("Attendance Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    
    try {
      const formData = new URLSearchParams();
      formData.append('action', 'ig_erp_update_self_profile');
      formData.append('nonce', (window as any).ig_erp?.nonce || '');
      formData.append('phone', profile.phone);
      formData.append('department', profile.department);
      formData.append('position', profile.position);

      const response = await fetch((window as any).ig_erp?.ajax_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData
      });
      
      const result = await response.json();
      if (result.success) {
        setLogs(prev => [{
          type: 'Profile Updated',
          time: new Date().toLocaleTimeString(),
          device: 'PORTAL-GUI'
        }, ...prev]);
        alert('Contact information updated successfully!');
      } else {
        alert('Failed to update: ' + (result.data || 'Unknown error'));
      }
    } catch (err) {
      console.error("Update Error:", err);
    } finally {
      setUpdating(false);
    }
  };

  const handleAddLeaveType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeaveType.name) return;
    setLoadingAdmin(true);
    try {
      const formData = new URLSearchParams();
      formData.append('action', 'ig_erp_add_leave_type');
      formData.append('nonce', (window as any).ig_erp?.nonce || '');
      formData.append('name', newLeaveType.name);
      formData.append('description', newLeaveType.description);

      const response = await fetch((window as any).ig_erp?.ajax_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData
      });
      const result = await response.json();
      if (result.success) {
        setNewLeaveType({ name: '', description: '' });
        setNotification({ message: 'Leave type added successfully', type: 'success' });
        setTimeout(() => setNotification(null), 3000);
        
        // Refresh
        const refreshData = new URLSearchParams();
        refreshData.append('action', 'ig_erp_get_leave_types');
        refreshData.append('nonce', (window as any).ig_erp?.nonce || '');
        const fresh = await fetch((window as any).ig_erp?.ajax_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: refreshData
        });
        const freshResult = await fresh.json();
        if (freshResult.success) setLeaveTypes(freshResult.data);
      } else {
        setNotification({ message: result.data, type: 'error' });
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAdmin(false);
    }
  };

  const handleDeleteLeaveType = async (id: number) => {
    if (!confirm('Are you sure you want to delete this leave type?')) return;
    try {
      const formData = new URLSearchParams();
      formData.append('action', 'ig_erp_delete_leave_type');
      formData.append('nonce', (window as any).ig_erp?.nonce || '');
      formData.append('id', id.toString());

      const response = await fetch((window as any).ig_erp?.ajax_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData
      });
      const result = await response.json();
      if (result.success) {
        setLeaveTypes(prev => prev.filter(t => t.id !== id));
        setNotification({ message: 'Leave type deleted', type: 'success' });
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;
    setLoadingStaff(true);
    try {
      const formData = new URLSearchParams();
      formData.append('action', 'ig_erp_save_employee');
      formData.append('nonce', (window as any).ig_erp?.nonce || '');
      formData.append('user_id', editingEmployee.user_id.toString());
      formData.append('employee_no', editingEmployee.employee_no || '');
      formData.append('shift_id', (editingEmployee.shift_id || '').toString());
      formData.append('department', editingEmployee.department || '');
      formData.append('position', editingEmployee.position || '');
      formData.append('phone', editingEmployee.phone || '');
      formData.append('status', editingEmployee.status || 'active');

      const response = await fetch((window as any).ig_erp?.ajax_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData
      });
      const result = await response.json();
      if (result.success) {
        setNotification({ message: 'Employee saved successfully', type: 'success' });
        setTimeout(() => setNotification(null), 3000);
        setEditingEmployee(null);
        // Refresh
        const refreshData = new URLSearchParams();
        refreshData.append('action', 'ig_erp_get_all_employees');
        refreshData.append('nonce', (window as any).ig_erp?.nonce || '');
        const fresh = await fetch((window as any).ig_erp?.ajax_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: refreshData
        });
        const freshResult = await fresh.json();
        if (freshResult.success) setAllEmployees(freshResult.data.employees);
      } else {
        setNotification({ message: result.data, type: 'error' });
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStaff(false);
    }
  };

  const handleDeleteEmployee = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this employee record?')) return;
    try {
      const formData = new URLSearchParams();
      formData.append('action', 'ig_erp_delete_employee');
      formData.append('nonce', (window as any).ig_erp?.nonce || '');
      formData.append('user_id', userId.toString());

      const response = await fetch((window as any).ig_erp?.ajax_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData
      });
      const result = await response.json();
      if (result.success) {
        setAllEmployees(prev => prev.filter(e => e.user_id !== userId));
        setNotification({ message: 'Employee record deleted', type: 'success' });
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRequestLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingLeave(true);

    try {
      const formData = new URLSearchParams();
      formData.append('action', 'ig_erp_submit_leave');
      formData.append('nonce', (window as any).ig_erp?.nonce || '');
      formData.append('leave_type', leaveForm.type);
      formData.append('start_date', leaveForm.start);
      formData.append('end_date', leaveForm.end);
      formData.append('reason', leaveForm.reason);

      const response = await fetch((window as any).ig_erp?.ajax_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      if (result.success) {
        alert('Leave request submitted!');
        setLeaveForm({ type: 'medical', start: '', end: '', reason: '' });
        // Refresh leaves list
        const fetchLeaves = async () => {
          const lResponse = await fetch((window as any).ig_erp?.ajax_url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ action: 'ig_erp_get_self_leaves', nonce: (window as any).ig_erp?.nonce || '' })
          });
          if (!lResponse.ok) return;
          const lResult = await lResponse.json();
          if (lResult.success) {
            setMyLeaves(lResult.data.map((l: any) => ({
              id: l.id,
              type: l.leave_type,
              start: l.start_date,
              end: l.end_date,
              reason: l.reason,
              status: l.status
            })));
          }
        };
        fetchLeaves();
      } else {
        alert('Error: ' + result.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLeave(false);
    }
  };

  const handleUpdateLeaveStatus = async (id: number, status: 'approved' | 'rejected') => {
    try {
      const formData = new URLSearchParams();
      formData.append('action', 'ig_erp_update_leave_status');
      formData.append('nonce', (window as any).ig_erp?.nonce || '');
      formData.append('id', id.toString());
      formData.append('status', status);

      const response = await fetch((window as any).ig_erp?.ajax_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      if (result.success) {
        setLogs(prev => [{
          type: 'Leave ' + status.charAt(0).toUpperCase() + status.slice(1),
          time: new Date().toLocaleTimeString(),
          device: 'MGR-CONSOLE'
        }, ...prev]);
        
        setNotification({ 
          message: `Leave request successfully ${status}.`, 
          type: 'success' 
        });
        setTimeout(() => setNotification(null), 3000);
        
        // Refresh list
        setMyLeaves(prev => prev.map(l => l.id === id ? { ...l, status } : l));
      } else {
        setNotification({ 
          message: 'Error updating leave: ' + result.data, 
          type: 'error' 
        });
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const fetchTeamLeaves = async () => {
      try {
        const formData = new URLSearchParams();
        formData.append('action', 'ig_erp_get_team_availability');
        formData.append('nonce', (window as any).ig_erp?.nonce || '');

        const response = await fetch((window as any).ig_erp?.ajax_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
        if (result.success) {
          setTeamLeaves(result.data.map((l: any) => ({
            name: l.display_name,
            type: l.leave_type
          })));
        }
      } catch (e) {
        console.error("Team leaves fetch error:", e);
      }
    };
    fetchTeamLeaves();
  }, []);

  const isInside = distance !== null && distance <= geofenceRadius;
  const showAccuracyWarning = accuracy !== null && accuracy > 50;

  return (
    <div className="space-y-6">
      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 20, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className={cn(
              "fixed top-12 left-1/2 z-[9999] px-6 py-3 rounded-full shadow-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-3 border shadow-wp-blue/10",
              notification.type === 'success' 
                ? "bg-white text-emerald-600 border-emerald-100" 
                : "bg-white text-rose-600 border-rose-100"
            )}
          >
            {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAccuracyWarning && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-amber-50 border-b border-amber-200 overflow-hidden"
          >
            <div className="max-w-7xl mx-auto px-6 py-2 flex items-center justify-between text-amber-800">
               <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
                  <AlertCircle className="w-4 h-4" />
                  GPS Precision Low ({Math.round(accuracy || 0)}m). Telemetry might be flagged for manual review.
               </div>
               <button onClick={() => setAccuracy(20)} className="text-[9px] font-bold underline cursor-pointer">FORCE SYNC</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-wp border border-wp-border shadow-sm gap-4">
        <div>
          <h1 className="text-2xl font-bold text-wp-dark font-serif tracking-tight flex items-center gap-3">
             <span className="text-wp-blue">👋</span> Welcome, Employee
             <span className={cn(
               "text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest border",
               profile.role === 'admin' ? "bg-wp-blue/10 text-wp-blue border-wp-blue/20" :
               profile.role === 'hr' ? "bg-purple-50 text-purple-600 border-purple-100" :
               "bg-slate-50 text-slate-600 border-slate-100"
             )}>
               {profile.role}
             </span>
          </h1>
          <p className="text-[10px] font-bold text-wp-muted uppercase tracking-widest mt-1">Sentinel Individual Access Portal</p>
        </div>
        <div className="flex items-center gap-6 bg-slate-50 border border-wp-border px-6 py-3 rounded-wp">
           <div className="flex flex-col items-end border-r border-wp-border pr-6">
              <span className="text-[9px] font-bold text-wp-muted uppercase">System Time</span>
              <span className="text-xl font-bold font-mono text-wp-dark">{currentTime.toLocaleTimeString([], { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
           </div>
           
           <div className="flex items-center gap-2">
              <div className={cn(
                "w-2.5 h-2.5 rounded-full animate-pulse",
                isInside ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-rose-500 shadow-[0_0_8px_#f43f5e]"
              )} />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-tight">
                  {isInside ? "HQ Connected" : "Connection Lost"}
                </span>
                <span className="text-[8px] text-wp-muted font-bold uppercase tracking-tighter">
                  {isInside ? "Within authorized perimeter" : "Awaiting perimeter entry"}
                </span>
              </div>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Section: Map and Profile */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-wp border border-wp-border shadow-sm overflow-hidden flex flex-col h-[500px]">
            <div className="px-5 py-4 border-b border-wp-border flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xs font-bold uppercase tracking-tight text-wp-muted flex items-center gap-2">
                 <Navigation className="w-3.5 h-3.5" /> Live Perimeter Link
              </h2>
              {distance !== null && (
                <div className="flex gap-2">
                  <span className={cn(
                    "text-[10px] font-mono font-bold px-2 py-0.5 rounded flex items-center gap-1.5 transition-colors",
                    accuracy && accuracy < 30 ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                    accuracy && accuracy < 100 ? "bg-amber-50 text-amber-600 border border-amber-100" :
                    "bg-rose-50 text-rose-600 border border-rose-100 animate-pulse"
                  )}>
                    {accuracy && accuracy < 100 ? <Navigation className="w-2.5 h-2.5" /> : <ShieldAlert className="w-2.5 h-2.5" />}
                    PRECISION: {accuracy ? Math.round(accuracy) : '--'}M
                  </span>
                  <span className="text-[10px] font-mono font-bold bg-slate-100 px-2 py-0.5 rounded border border-wp-border">
                    DIST: {Math.round(distance)}M
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1 relative z-0">
              <MapContainer 
                center={[officeLat, officeLng]} 
                zoom={15} 
                className="h-full w-full"
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <Circle 
                  center={[officeLat, officeLng]} 
                  radius={geofenceRadius} 
                  pathOptions={{ 
                    color: isInside ? '#2271b1' : '#f43f5e', 
                    fillColor: isInside ? '#2271b1' : '#f43f5e',
                    fillOpacity: 0.1 
                  }} 
                />
                {userLocation && (
                  <>
                    <Marker position={userLocation} />
                    <MapRecenter lat={userLocation[0]} lng={userLocation[1]} />
                  </>
                )}
              </MapContainer>
              
              {!isInside && (
                <div className="absolute inset-0 bg-rose-950/20 backdrop-blur-[1px] pointer-events-none z-10 flex items-center justify-center">
                   <div className="bg-rose-600 text-white px-4 py-2 rounded-wp shadow-2xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 animate-pulse">
                      <ShieldAlert className="w-4 h-4" /> Outside Authorized Zone
                   </div>
                </div>
              )}
            </div>
          </div>

          {/* Profile Edit Card */}
          <div className="bg-white rounded-wp border border-wp-border shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
               <div>
                 <h2 className="text-sm font-bold uppercase tracking-tight text-wp-muted mb-1">Personal Contact Information</h2>
                 <p className="text-[10px] text-wp-muted font-bold uppercase tracking-widest">Update your reachable details within the ERP core</p>
               </div>
               <div className="p-2 bg-slate-50 rounded">
                  <Smartphone className="w-4 h-4 text-wp-blue" />
               </div>
            </div>

            <form onSubmit={handleUpdateProfile} className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="space-y-2">
                  <label className="text-[10px] font-bold text-wp-muted uppercase flex items-center gap-1.5">
                    <Smartphone className="w-3 h-3" /> Contact Phone
                  </label>
                  <input 
                    type="text" 
                    value={profile.phone}
                    onChange={(e) => setProfile(p => ({ ...p, phone: e.target.value }))}
                    placeholder="e.g. +1 555-0123"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-wp-border rounded-wp text-sm focus:ring-2 focus:ring-wp-blue/20 outline-none transition-all"
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-bold text-wp-muted uppercase flex items-center gap-1.5">
                    <Building2 className="w-3 h-3" /> Department
                  </label>
                  <input 
                    type="text" 
                    value={profile.department}
                    onChange={(e) => setProfile(p => ({ ...p, department: e.target.value }))}
                    placeholder="e.g. Engineering"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-wp-border rounded-wp text-sm focus:ring-2 focus:ring-wp-blue/20 outline-none transition-all"
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-bold text-wp-muted uppercase flex items-center gap-1.5">
                    <Briefcase className="w-3 h-3" /> Current Position
                  </label>
                  <input 
                    type="text" 
                    value={profile.position}
                    onChange={(e) => setProfile(p => ({ ...p, position: e.target.value }))}
                    placeholder="e.g. Senior Architect"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-wp-border rounded-wp text-sm focus:ring-2 focus:ring-wp-blue/20 outline-none transition-all"
                  />
               </div>
               
               <div className="md:col-span-3 flex justify-end">
                  <button 
                    type="submit"
                    disabled={updating}
                    className={cn(
                      "flex items-center gap-2 px-6 py-2.5 rounded-wp font-bold text-[11px] uppercase tracking-wider shadow-sm transition-all active:scale-95",
                      updating ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-wp-blue text-white hover:bg-wp-blue-hover"
                    )}
                  >
                    {updating ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    {updating ? "Saving Changes..." : "Update Private Profile"}
                  </button>
               </div>
            </form>
          </div>

          {/* Request Leave Card */}
          <div className="bg-white rounded-wp border border-wp-border shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
               <div>
                 <h2 className="text-sm font-bold uppercase tracking-tight text-wp-muted mb-1">Request Leave of Absence</h2>
                 <p className="text-[10px] text-wp-muted font-bold uppercase tracking-widest">Formal leave protocol for system logs</p>
               </div>
               <div className="p-2 bg-slate-50 rounded">
                  <CalendarDays className="w-4 h-4 text-wp-blue" />
               </div>
            </div>

            <style>
              {`
                .react-datepicker-wrapper { width: 100%; }
                .react-datepicker__input-container input {
                  width: 100%;
                  padding: 10px 16px;
                  background-color: #f8fafc;
                  border: 1px solid #d1d5db;
                  border-radius: 4px;
                  font-size: 14px;
                }
                .react-datepicker {
                  font-family: inherit;
                  border-color: #e5e7eb;
                  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                }
                .react-datepicker__header {
                  background-color: #f8fafc;
                  border-bottom-color: #e5e7eb;
                }
                .react-datepicker__day--selected, .react-datepicker__day--in-selecting-range, .react-datepicker__day--in-range {
                  background-color: #2271b1 !important;
                }
              `}
            </style>

            <form onSubmit={handleRequestLeave} className="space-y-4">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-wp-muted uppercase">Leave Type</label>
                    <select 
                      value={leaveForm.type}
                      onChange={(e) => setLeaveForm(f => ({ ...f, type: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-wp-border rounded-wp text-sm"
                    >
                      {leaveTypes.length > 0 ? (
                        leaveTypes.map(t => (
                          <option key={t.id} value={t.name}>{t.name}</option>
                        ))
                      ) : (
                        <>
                          <option value="medical">Medical</option>
                          <option value="casual">Casual</option>
                          <option value="vacation">Vacation</option>
                          <option value="emergency">Emergency</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-wp-muted uppercase">Select Date Range</label>
                    <DatePicker
                      selectsRange={true}
                      startDate={leaveForm.start ? parseISO(leaveForm.start) : null}
                      endDate={leaveForm.end ? parseISO(leaveForm.end) : null}
                      onChange={(update) => {
                        const [start, end] = update;
                        setLeaveForm(f => ({ 
                          ...f, 
                          start: start ? format(start, 'yyyy-MM-dd') : '',
                          end: end ? format(end, 'yyyy-MM-dd') : ''
                        }));
                      }}
                      isClearable={true}
                      placeholderText="Pick start and end dates"
                      className="w-full"
                    />
                  </div>
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-bold text-wp-muted uppercase">Detailed Reason</label>
                  <textarea 
                    rows={2}
                    value={leaveForm.reason}
                    onChange={(e) => setLeaveForm(f => ({ ...f, reason: e.target.value }))}
                    placeholder="Briefly explain the cause of absence..."
                    className="w-full px-4 py-2 bg-slate-50 border border-wp-border rounded-wp text-sm outline-none focus:ring-2 focus:ring-wp-blue/20"
                  />
               </div>
               <div className="flex justify-end">
                  <button 
                    type="submit"
                    disabled={loadingLeave}
                    className="flex items-center gap-2 px-6 py-2 bg-wp-blue text-white rounded-wp text-[11px] font-bold uppercase shadow-sm active:scale-95 disabled:opacity-50"
                  >
                    {loadingLeave ? "Processing..." : <><SendHorizontal className="w-3.5 h-3.5" /> Submit Request</>}
                  </button>
               </div>
            </form>
          </div>
        </div>

        {/* Action Section */}
        <div className="flex flex-col gap-6">
          {/* Manager/Admin Panel Toggle */}
          {(profile.role === 'admin' || profile.role === 'hr') && (
            <div className="flex flex-col gap-4">
              <div className="bg-white rounded-wp border border-wp-border shadow-sm p-4 flex justify-between items-center bg-wp-blue/5">
                 <div className="flex items-center gap-3">
                    <Settings className="w-4 h-4 text-wp-blue" />
                    <div>
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-wp-dark">Administrative Node</h3>
                      <p className="text-[9px] text-wp-muted font-bold uppercase">Configure system-wide parameters</p>
                    </div>
                 </div>
                 <button 
                  onClick={() => { setShowAdminPanel(!showAdminPanel); setShowStaffPanel(false); }}
                  className="px-4 py-1.5 bg-white border border-wp-blue text-wp-blue rounded-wp text-[10px] font-bold uppercase hover:bg-wp-blue hover:text-white transition-all shadow-sm"
                 >
                   {showAdminPanel ? 'Close Panel' : 'Manage Leave Types'}
                 </button>
              </div>

              <div className="bg-white rounded-wp border border-wp-border shadow-sm p-4 flex justify-between items-center bg-emerald-500/5">
                 <div className="flex items-center gap-3">
                    <Users2 className="w-4 h-4 text-emerald-600" />
                    <div>
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-wp-dark">Staff Command Node</h3>
                      <p className="text-[9px] text-wp-muted font-bold uppercase">Provision workforce & link roles</p>
                    </div>
                 </div>
                 <button 
                  onClick={() => { setShowStaffPanel(!showStaffPanel); setShowAdminPanel(false); }}
                  className="px-4 py-1.5 bg-white border border-emerald-600 text-emerald-600 rounded-wp text-[10px] font-bold uppercase hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                 >
                   {showStaffPanel ? 'Close Panel' : 'Manage Employees'}
                 </button>
              </div>
            </div>
          )}

          {/* Admin Panel: Leave Type Management */}
          <AnimatePresence>
            {showAdminPanel && (profile.role === 'admin' || profile.role === 'hr') && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-white rounded-wp border border-wp-border shadow-sm p-5 space-y-6">
                   <div className="flex items-center justify-between border-b border-wp-border pb-3">
                      <h3 className="text-xs font-bold uppercase tracking-tight text-wp-muted flex items-center gap-2">
                        <Plus className="w-3.5 h-3.5" /> Define New Leave Category
                      </h3>
                   </div>
                   
                   <form onSubmit={handleAddLeaveType} className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-wp-muted uppercase">Type Name</label>
                        <input 
                          type="text"
                          required
                          placeholder="e.g. Sabbatical, Remote Focus"
                          value={newLeaveType.name}
                          onChange={(e) => setNewLeaveType(p => ({ ...p, name: e.target.value }))}
                          className="w-full px-4 py-2 bg-slate-50 border border-wp-border rounded-wp text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-wp-muted uppercase">Description (Optional)</label>
                        <textarea 
                          rows={2}
                          placeholder="Brief explanation of policy..."
                          value={newLeaveType.description}
                          onChange={(e) => setNewLeaveType(p => ({ ...p, description: e.target.value }))}
                          className="w-full px-4 py-2 bg-slate-50 border border-wp-border rounded-wp text-sm"
                        />
                      </div>
                      <button 
                        type="submit"
                        disabled={loadingAdmin}
                        className="w-full py-2.5 bg-wp-blue text-white rounded-wp text-[10px] font-bold uppercase flex items-center justify-center gap-2"
                      >
                        {loadingAdmin ? 'Processing...' : <><Save className="w-3.5 h-3.5" /> Register Type</>}
                      </button>
                   </form>

                   <div className="space-y-3">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-wp-muted">Existing Categories</h4>
                      <div className="divide-y divide-wp-border border border-wp-border rounded-wp bg-slate-50/30 overflow-hidden">
                        {leaveTypes.length > 0 ? leaveTypes.map(t => (
                          <div key={t.id} className="px-4 py-2.5 flex justify-between items-center group hover:bg-white transition-colors">
                             <div>
                                <p className="text-[11px] font-bold text-wp-dark uppercase tracking-tight">{t.name}</p>
                                {t.description && <p className="text-[9px] text-wp-muted">{t.description}</p>}
                             </div>
                             <button 
                                onClick={() => handleDeleteLeaveType(t.id)}
                                className="p-1.5 text-wp-muted hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all rounded hover:bg-rose-50"
                             >
                                <Trash2 className="w-3.5 h-3.5" />
                             </button>
                          </div>
                        )) : (
                          <p className="px-4 py-4 text-center text-[10px] text-wp-muted italic">No custom leave types defined.</p>
                        )}
                      </div>
                   </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

            {/* Staff Panel: Employee Management */}
          <AnimatePresence>
            {showStaffPanel && (profile.role === 'admin' || profile.role === 'hr') && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-white rounded-wp border border-wp-border shadow-sm p-5 space-y-6">
                  <div className="flex items-center justify-between border-b border-wp-border pb-3">
                    <h3 className="text-xs font-bold uppercase tracking-tight text-wp-muted flex items-center gap-2">
                      <UserPlus className="w-3.5 h-3.5" /> Personnel Registry
                    </h3>
                    <button 
                      onClick={() => setEditingEmployee({ user_id: 0, employee_no: '', shift_id: '', department: '', position: '', phone: '', status: 'active' })}
                      className="text-[9px] font-bold bg-emerald-500 text-white px-2 py-1 rounded-sm uppercase tracking-widest hover:bg-emerald-600"
                    >
                      Add Employee
                    </button>
                  </div>

                  {editingEmployee && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-slate-50 p-4 border border-wp-border rounded-wp"
                    >
                      <form onSubmit={handleSaveEmployee} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-wp-muted uppercase">Global Identity (User)</label>
                            {editingEmployee.user_id === 0 ? (
                              <select 
                                required
                                value={editingEmployee.user_id}
                                onChange={(e) => setEditingEmployee({...editingEmployee, user_id: parseInt(e.target.value)})}
                                className="w-full px-3 py-1.5 bg-white border border-wp-border rounded text-xs outline-none"
                              >
                                <option value="0">Select WP User...</option>
                                {allUsers.map((u: any) => (
                                  <option key={u.ID} value={u.ID}>{u.display_name} ({u.user_email})</option>
                                ))}
                              </select>
                            ) : (
                              <p className="text-xs font-bold pt-1">{allUsers.find((u: any) => u.ID === editingEmployee.user_id)?.display_name || 'Selected User'}</p>
                            )}
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-wp-muted uppercase">Employee ID</label>
                            <input 
                              type="text"
                              value={editingEmployee.employee_no}
                              onChange={(e) => setEditingEmployee({...editingEmployee, employee_no: e.target.value})}
                              className="w-full px-3 py-1.5 bg-white border border-wp-border rounded text-xs outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                           <div className="space-y-1">
                            <label className="text-[9px] font-bold text-wp-muted uppercase">Department</label>
                            <input 
                              type="text"
                              value={editingEmployee.department}
                              onChange={(e) => setEditingEmployee({...editingEmployee, department: e.target.value})}
                              className="w-full px-3 py-1.5 bg-white border border-wp-border rounded text-xs outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-wp-muted uppercase">Position</label>
                            <input 
                              type="text"
                              value={editingEmployee.position}
                              onChange={(e) => setEditingEmployee({...editingEmployee, position: e.target.value})}
                              className="w-full px-3 py-1.5 bg-white border border-wp-border rounded text-xs outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-wp-muted uppercase">Duty Shift</label>
                            <select 
                              value={editingEmployee.shift_id}
                              onChange={(e) => setEditingEmployee({...editingEmployee, shift_id: e.target.value})}
                              className="w-full px-3 py-1.5 bg-white border border-wp-border rounded text-xs outline-none"
                            >
                              <option value="">No Shift</option>
                              {allShifts.map((s: any) => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                           <button 
                            type="button"
                            onClick={() => setEditingEmployee(null)}
                            className="px-4 py-1.5 text-[10px] font-bold text-wp-muted uppercase hover:text-wp-text"
                           >
                            Cancel
                           </button>
                           <button 
                            type="submit"
                            disabled={loadingStaff}
                            className="px-6 py-1.5 bg-wp-blue text-white rounded text-[10px] font-bold uppercase shadow-sm flex items-center gap-2"
                           >
                            {loadingStaff ? 'Saving...' : <><Save className="w-3.5 h-3.5" /> Commit Changes</>}
                           </button>
                        </div>
                      </form>
                    </motion.div>
                  )}

                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-wp-muted">Workforce Catalog</h4>
                    <div className="border border-wp-border rounded-wp overflow-hidden bg-white">
                       <table className="w-full text-left">
                          <thead className="bg-slate-50 border-b border-wp-border">
                            <tr>
                              <th className="px-4 py-2 text-[9px] font-bold text-wp-muted uppercase">Employee</th>
                              <th className="px-4 py-2 text-[9px] font-bold text-wp-muted uppercase">Role/Dept</th>
                              <th className="px-4 py-2 text-[9px] font-bold text-wp-muted uppercase">Shift</th>
                              <th className="px-4 py-2 text-[9px] font-bold text-wp-muted uppercase text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-wp-border">
                            {allEmployees.map((e: any) => (
                              <tr key={e.user_id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-4 py-3">
                                   <p className="text-[10px] font-bold text-wp-dark uppercase">{e.display_name}</p>
                                   <p className="text-[9px] text-wp-muted font-mono">{e.employee_no || 'NO-ID'}</p>
                                </td>
                                <td className="px-4 py-3">
                                   <p className="text-[10px] text-wp-text">{e.position || 'N/A'}</p>
                                   <p className="text-[9px] text-wp-muted uppercase font-bold">{e.department || 'GENERAL'}</p>
                                </td>
                                <td className="px-4 py-3">
                                   <span className="text-[9px] px-2 py-0.5 bg-slate-100 rounded border border-wp-border font-bold uppercase tracking-tighter">
                                     {e.shift_name || 'UNASSIGNED'}
                                   </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                   <div className="flex justify-end gap-1">
                                      <button 
                                        onClick={() => setEditingEmployee(e)}
                                        className="p-1.5 text-wp-blue hover:bg-wp-blue/10 rounded transition-all"
                                      >
                                         <Pencil className="w-3.5 h-3.5" />
                                      </button>
                                      <button 
                                        onClick={() => handleDeleteEmployee(e.user_id)}
                                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded transition-all"
                                      >
                                         <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                   </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                       </table>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

            {/* My Leave Requests (New) */}
            <div className="bg-white rounded-wp border border-wp-border shadow-sm overflow-hidden flex flex-col">
              <div className="px-5 py-4 border-b border-wp-border flex justify-between items-center bg-slate-50/50">
                 <h3 className="text-[10px] font-bold uppercase tracking-widest text-wp-muted flex items-center gap-2">
                    <CalendarDays className="w-3.5 h-3.5" /> My Leave Requests
                 </h3>
                 <span className="text-[9px] font-bold bg-slate-200 px-1.5 py-0.5 rounded text-wp-dark">HISTORY</span>
              </div>
              <div className="p-0 overflow-y-auto max-h-[300px]">
                  <table className="w-full text-left">
                    <tbody className="divide-y divide-wp-border">
                       {myLeaves.length > 0 ? myLeaves.map((l, i) => (
                         <tr key={i} className="hover:bg-slate-50/30 transition-colors">
                           <td className="px-4 py-3">
                              <p className="text-[11px] font-bold text-wp-text">
                                {l.userName ? <span className="text-wp-blue mr-1">[{l.userName}]</span> : null}
                                {l.type.toUpperCase()}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <CalendarDays className="w-2.5 h-2.5 text-wp-muted" />
                                <p className="text-[9px] text-wp-muted font-bold tracking-tight">
                                  {isValid(parseISO(l.start)) ? format(parseISO(l.start), 'MMM d, yyyy') : l.start} 
                                  <span className="mx-1 opacity-40">→</span> 
                                  {isValid(parseISO(l.end)) ? format(parseISO(l.end), 'MMM d, yyyy') : l.end}
                                </p>
                              </div>
                           </td>
                           <td className="px-4 py-3 text-right">
                              <div className="flex flex-col items-end gap-1">
                                <div className={cn(
                                  "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[8px] font-bold uppercase tracking-wider",
                                  l.status === 'approved' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                  l.status === 'rejected' ? "bg-rose-50 text-rose-700 border-rose-100" :
                                  "bg-amber-50 text-amber-700 border-amber-100 animate-pulse"
                                )}>
                                  <div className={cn(
                                    "w-1 h-1 rounded-full",
                                    l.status === 'approved' ? "bg-emerald-500" :
                                    l.status === 'rejected' ? "bg-rose-500" :
                                    "bg-amber-500"
                                  )} />
                                  {l.status}
                                </div>
                                
                                {profile.isManager && l.status === 'pending' && (
                                  <div className="flex gap-1 mt-1">
                                    <button 
                                      onClick={() => handleUpdateLeaveStatus(l.id, 'approved')}
                                      className="p-1 bg-emerald-100 text-emerald-600 rounded hover:bg-emerald-200 transition-colors"
                                      title="Approve"
                                    >
                                      <CheckCircle2 className="w-3 h-3" />
                                    </button>
                                    <button 
                                      onClick={() => handleUpdateLeaveStatus(l.id, 'rejected')}
                                      className="p-1 bg-rose-100 text-rose-600 rounded hover:bg-rose-200 transition-colors"
                                      title="Reject"
                                    >
                                      <AlertCircle className="w-3 h-3" />
                                    </button>
                                  </div>
                                )}
                              </div>
                           </td>
                         </tr>
                       )) : (
                         <tr><td className="px-5 py-8 text-center text-wp-muted text-xs italic">No leave data available.</td></tr>
                       )}
                    </tbody>
                 </table>
              </div>
            </div>

            {/* Team Availability Widget (New) */}
            <div className="bg-white rounded-wp border border-wp-border shadow-sm overflow-hidden flex flex-col">
              <div className="px-5 py-4 border-b border-wp-border flex justify-between items-center bg-slate-50/50">
                 <h3 className="text-[10px] font-bold uppercase tracking-widest text-wp-muted flex items-center gap-2">
                    <Users2 className="w-3.5 h-3.5" /> Out of Office Today
                 </h3>
                 <span className="text-[9px] font-bold text-wp-blue">{teamLeaves.length} ON LEAVE</span>
              </div>
              <div className="p-0 overflow-y-auto max-h-[200px]">
                 <div className="divide-y divide-wp-border">
                    {teamLeaves.length > 0 ? teamLeaves.map((l, i) => (
                      <div key={i} className="px-4 py-3 flex items-center gap-3 hover:bg-slate-50/30 transition-colors">
                        <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-wp-border overflow-hidden">
                           <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${l.name}`} alt="av" />
                        </div>
                        <div className="min-w-0 flex-1">
                           <p className="text-[11px] font-bold text-wp-text truncate">{l.name}</p>
                           <p className="text-[9px] text-wp-muted uppercase font-bold tracking-tight">{l.type}</p>
                        </div>
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      </div>
                    )) : (
                      <div className="px-5 py-6 text-center text-wp-muted text-[10px] italic">Everyone is available today.</div>
                    )}
                 </div>
              </div>
              <div className="px-4 py-2 border-t border-wp-border bg-slate-50/30">
                 <p className="text-[9px] text-wp-muted leading-tight">
                    Synced with <strong>Company Google Calendar</strong>
                 </p>
              </div>
            </div>

           <div className="bg-white p-6 rounded-wp border border-wp-border shadow-sm flex-1 flex flex-col items-center justify-center text-center">
              <div className="mb-6 relative">
                 <motion.div 
                   animate={{ 
                     boxShadow: checkedIn ? "0 0 20px rgba(16, 185, 129, 0.2)" : "0 0 0px rgba(0,0,0,0)"
                   }}
                   className={cn(
                    "w-24 h-24 rounded-full flex items-center justify-center border-4 transition-all duration-700",
                    checkedIn ? "border-emerald-500 bg-emerald-50" : "border-slate-200 bg-slate-50"
                  )}
                 >
                    {checkedIn ? (
                      <UserCheck className="w-12 h-12 text-emerald-600" />
                    ) : (
                      <UserX className="w-12 h-12 text-slate-300" />
                    )}
                 </motion.div>
                 {checkedIn && (
                   <motion.div 
                     initial={{ scale: 0 }}
                     animate={{ scale: 1 }}
                     className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1.5 rounded-full shadow-lg border-2 border-white"
                   >
                      <CheckCircle2 className="w-4 h-4" />
                   </motion.div>
                 )}
              </div>

              <h3 className="font-bold text-lg mb-1">{checkedIn ? "Duty Status: ACTIVE" : "Duty Status: IDLE"}</h3>
              <p className="text-xs text-wp-muted mb-8 max-w-[200px]">
                {checkedIn 
                  ? "Your telemetry is being synced with the Sentinel core. Secure shift in progress."
                  : "Please enter the authorized perimeter and initialize check-in to start your shift."}
              </p>

              <div className="w-full space-y-3">
                 <button 
                  onClick={() => handleAttendance('in')}
                  disabled={loading || checkedIn || !isInside}
                  className={cn(
                    "w-full py-4 rounded-wp font-bold uppercase tracking-widest text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-2",
                    checkedIn ? "bg-slate-100 text-slate-400 cursor-not-allowed" : 
                    !isInside ? "bg-rose-50 text-rose-300 cursor-not-allowed border border-rose-100/50" :
                    "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200"
                  )}
                 >
                    {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <UserCheck className="w-4 h-4" />}
                    {loading ? "Transmitting..." : "Initialize Check-In"}
                 </button>

                 <button 
                  onClick={() => handleAttendance('out')}
                  disabled={loading || !checkedIn}
                  className={cn(
                    "w-full py-4 rounded-wp font-bold uppercase tracking-widest text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-2",
                    !checkedIn ? "bg-slate-100 text-slate-400 cursor-not-allowed" : 
                    "bg-rose-600 text-white hover:bg-rose-700 shadow-rose-200"
                  )}
                 >
                    {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <UserX className="w-4 h-4" />}
                    {loading ? "Terminating..." : "Secure Check-Out"}
                 </button>
              </div>

              {!isInside && !checkedIn && (
                <div className="mt-6 flex items-center gap-2 text-rose-600 bg-rose-50 px-3 py-1.5 rounded-full">
                   <AlertCircle className="w-3 h-3" />
                   <span className="text-[10px] font-bold uppercase tracking-tighter">Geofence Validation Required</span>
                </div>
              )}
           </div>

           <div className="bg-wp-dark p-6 rounded-wp text-white relative overflow-hidden flex flex-col min-h-[220px]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-wp-blue/10 rounded-full -mr-16 -mt-16" />
              <h4 className="text-[10px] font-bold text-wp-muted uppercase tracking-widest mb-4 flex justify-between items-center relative z-10">
                Live Shift Logs
                <div className="flex gap-1">
                  <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                  <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse delay-75" />
                  <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse delay-150" />
                </div>
              </h4>
              <div className="space-y-4 relative z-10 overflow-y-auto max-h-[200px] pr-2 custom-scrollbar">
                 {logs.map((log, i) => (
                   <motion.div 
                     initial={{ x: -10, opacity: 0 }}
                     animate={{ x: 0, opacity: 1 }}
                     key={i} 
                     className="flex gap-3"
                   >
                      <div className="w-px bg-slate-800 relative">
                         <div className={cn(
                           "absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full",
                           i === 0 ? "bg-wp-blue shadow-[0_0_8px_#2271b1]" : "bg-slate-600"
                         )} />
                      </div>
                      <div className="flex-1 min-w-0">
                         <p className={cn("text-[11px] font-bold", i === 0 ? "text-white" : "text-slate-400")}>{log.type}</p>
                         <p className="text-[9px] text-wp-muted font-mono uppercase truncate">
                            {log.time} • {log.device} {log.accuracy ? `• PRE: ${Math.round(log.accuracy)}M` : ''}
                         </p>
                      </div>
                   </motion.div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

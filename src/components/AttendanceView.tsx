import React, { useState, useEffect } from 'react';
import { useDb } from '../context/DbContext';
import { Attendance, Staff } from '../types';
import { 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Plane, 
  Clock, 
  Sparkles, 
  UserCheck, 
  CalendarDays, 
  Bookmark, 
  FileText,
  HelpCircle,
  Save,
  Check
} from 'lucide-react';
import { motion } from 'motion/react';

export default function AttendanceView() {
  const { staffList, attendance, saveMultipleAttendance, currentUser, saveAttendance } = useDb();
  
  // Date states
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`; // local ISO date string
  });

  const [dateStaffRecords, setDateStaffRecords] = useState<{[staffId: string]: Partial<Attendance>}>({});
  const [holidayName, setHolidayName] = useState('');
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Get active staff members (excluding suspended, owner, and admin roles)
  const activeStaff = staffList.filter(s => s.status === 'Active' && s.role !== 'Owner' && s.role !== 'Admin');

  // Check if current selected date is Sunday
  const isSunday = new Date(selectedDate).getDay() === 0;

  // Load existing records for the selected date
  useEffect(() => {
    const existingForDate = attendance.filter(a => a.date === selectedDate);
    const initialMap: {[staffId: string]: Partial<Attendance>} = {};

    activeStaff.forEach(staff => {
      const existing = existingForDate.find(a => a.staffId === staff.id);
      if (existing) {
        initialMap[staff.id] = { ...existing };
      } else {
        // default state: if Sunday, default to 'Leave', else default to 'Present'
        initialMap[staff.id] = {
          id: `${selectedDate}-${staff.id}`,
          date: selectedDate,
          staffId: staff.id,
          staffName: staff.name,
          status: isSunday ? 'Leave' : 'Present',
          checkIn: '09:00',
          checkOut: '18:00',
          notes: isSunday ? 'Sunday Weekly Off' : '',
          markedBy: currentUser?.username || 'system'
        };
      }
    });

    setDateStaffRecords(initialMap);
  }, [selectedDate, attendance, staffList, isSunday]);

  // Handle single staff status change
  const handleStatusChange = (staffId: string, status: 'Present' | 'Absent' | 'Leave' | 'Public Holiday') => {
    setDateStaffRecords(prev => {
      const updated = { ...prev[staffId] };
      updated.status = status;
      if (status === 'Leave') {
        updated.notes = updated.notes || 'Personal Leave';
        updated.checkIn = '';
        updated.checkOut = '';
      } else if (status === 'Absent') {
        updated.notes = updated.notes || 'Unexcused Absence';
        updated.checkIn = '';
        updated.checkOut = '';
      } else if (status === 'Public Holiday') {
        updated.notes = updated.notes || 'Festival Holiday';
        updated.checkIn = '';
        updated.checkOut = '';
      } else {
        // Present
        updated.checkIn = updated.checkIn || '09:00';
        updated.checkOut = updated.checkOut || '18:00';
        updated.notes = '';
      }
      return {
        ...prev,
        [staffId]: updated
      };
    });
  };

  // Handle time update
  const handleTimeChange = (staffId: string, field: 'checkIn' | 'checkOut', value: string) => {
    setDateStaffRecords(prev => {
      const updated = { ...prev[staffId], [field]: value };
      return {
        ...prev,
        [staffId]: updated
      };
    });
  };

  // Handle notes update
  const handleNotesChange = (staffId: string, value: string) => {
    setDateStaffRecords(prev => {
      const updated = { ...prev[staffId], notes: value };
      return {
        ...prev,
        [staffId]: updated
      };
    });
  };

  // Mark all as Sunday Weekly Leave
  const handleAutoMarkSunday = () => {
    setDateStaffRecords(prev => {
      const updated = { ...prev };
      activeStaff.forEach(staff => {
        updated[staff.id] = {
          ...updated[staff.id],
          status: 'Leave',
          notes: 'Sunday Weekly Off',
          checkIn: '',
          checkOut: '',
          markedBy: currentUser?.username || 'system'
        };
      });
      return updated;
    });
    setSuccessMsg('Statuses updated to Sunday Weekly Off! Click Save below to apply.');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // Mark all as Public Holiday
  const handleMarkPublicHolidaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!holidayName.trim()) return;

    setDateStaffRecords(prev => {
      const updated = { ...prev };
      activeStaff.forEach(staff => {
        updated[staff.id] = {
          ...updated[staff.id],
          status: 'Public Holiday',
          notes: `Public Holiday: ${holidayName.trim()}`,
          checkIn: '',
          checkOut: '',
          markedBy: currentUser?.username || 'system'
        };
      });
      return updated;
    });

    setShowHolidayModal(false);
    setHolidayName('');
    setSuccessMsg(`Roster pre-filled with Public Holiday (${holidayName})! Click Save below to apply.`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // Submit all attendance logs for the active date
  const handleSaveAll = () => {
    const finalRecords: Attendance[] = [];
    activeStaff.forEach(staff => {
      const r = dateStaffRecords[staff.id];
      if (r) {
        finalRecords.push({
          id: r.id || `${selectedDate}-${staff.id}`,
          date: selectedDate,
          staffId: staff.id,
          staffName: staff.name,
          status: r.status || 'Present',
          checkIn: r.checkIn,
          checkOut: r.checkOut,
          notes: r.notes || '',
          markedBy: currentUser?.username || 'system'
        });
      }
    });

    saveMultipleAttendance(finalRecords);
    setSuccessMsg(`Attendance logs for ${selectedDate} have been saved successfully.`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // Quick statistics calculation
  const totalPresent = activeStaff.filter(s => dateStaffRecords[s.id]?.status === 'Present').length;
  const totalAbsent = activeStaff.filter(s => dateStaffRecords[s.id]?.status === 'Absent').length;
  const totalLeave = activeStaff.filter(s => dateStaffRecords[s.id]?.status === 'Leave').length;
  const totalHolidays = activeStaff.filter(s => dateStaffRecords[s.id]?.status === 'Public Holiday').length;

  return (
    <div className="space-y-6">
      {/* Head */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 leading-tight">Staff Attendance Register</h2>
          <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">Manage daily timekeeping logs, leaves, Sundays off, and national public holidays.</p>
        </div>
        
        {/* Date Selector */}
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl p-1.5 shadow-sm">
          <Calendar size={15} className="text-slate-400 ml-2" />
          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 outline-none pr-2"
          />
        </div>
      </div>

      {/* Sundays Info & Helper Tools Banner */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between p-4 bg-blue-50/50 dark:bg-slate-900 border border-blue-500/10 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/10 text-blue-600 rounded-xl shrink-0">
            <Sparkles size={18} />
          </div>
          <div>
            <span className="block text-xs font-extrabold text-blue-900 dark:text-blue-400">
              {isSunday ? 'Today is Sunday (Weekly Off)' : 'Quick Administration Presets'}
            </span>
            <span className="block text-[10px] text-blue-700/80 dark:text-slate-400 font-medium">
              {isSunday 
                ? 'Sunday is designated as shop weekly off. Easily mark leave logs using the preset.' 
                : 'Bulk pre-fill status fields to save time during holiday seasons.'}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {isSunday && (
            <button
              onClick={handleAutoMarkSunday}
              className="py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] rounded-lg tracking-wide uppercase shadow-sm cursor-pointer"
            >
              Mark all as Sunday Leave
            </button>
          )}
          <button
            onClick={() => setShowHolidayModal(true)}
            className="py-1.5 px-3 bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-800 dark:hover:bg-slate-750 font-bold text-[10px] rounded-lg tracking-wide uppercase shadow-sm cursor-pointer"
          >
            Mark Public Holiday
          </button>
        </div>
      </div>

      {successMsg && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-emerald-500/10 border border-emerald-500/10 text-emerald-600 text-xs font-bold rounded-xl text-center"
        >
          {successMsg}
        </motion.div>
      )}

      {/* Grid counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm text-center">
          <span className="block text-2xl font-black text-emerald-600 font-mono">{totalPresent}</span>
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-1">Present Today</span>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm text-center">
          <span className="block text-2xl font-black text-rose-500 font-mono">{totalAbsent}</span>
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-1">Absent</span>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm text-center">
          <span className="block text-2xl font-black text-amber-500 font-mono">{totalLeave}</span>
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-1">Approved Leave</span>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm text-center">
          <span className="block text-2xl font-black text-indigo-500 font-mono">{totalHolidays}</span>
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-1">Public Holiday</span>
        </div>
      </div>

      {/* Register List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
          <h3 className="font-extrabold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider">Attendance sheet for {new Date(selectedDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3>
          <span className="text-[10px] font-bold text-slate-400">Total: {activeStaff.length} Roster entries</span>
        </div>

        {activeStaff.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 font-semibold">
            No active staff listed in directory database. Please register staff first.
          </div>
        ) : (
          <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
            {activeStaff.map(staff => {
              const record = dateStaffRecords[staff.id] || {};
              const currentStatus = record.status || 'Present';

              return (
                <div key={staff.id} className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/20">
                  {/* Left: Info */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 text-sm">
                      {staff.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-100">{staff.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">{staff.role}</span>
                        <span className="text-[9px] font-semibold text-slate-400 font-mono">@{staff.username}</span>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Selection Buttons */}
                  <div className="flex items-center flex-wrap gap-1.5">
                    {/* Present */}
                    <button
                      type="button"
                      onClick={() => handleStatusChange(staff.id, 'Present')}
                      className={`py-1.5 px-3 rounded-xl font-bold text-[10px] uppercase flex items-center gap-1 cursor-pointer transition-all ${
                        currentStatus === 'Present' 
                          ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' 
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border border-transparent hover:bg-slate-100 dark:hover:bg-slate-750'
                      }`}
                    >
                      <UserCheck size={11} /> Present
                    </button>

                    {/* Absent */}
                    <button
                      type="button"
                      onClick={() => handleStatusChange(staff.id, 'Absent')}
                      className={`py-1.5 px-3 rounded-xl font-bold text-[10px] uppercase flex items-center gap-1 cursor-pointer transition-all ${
                        currentStatus === 'Absent' 
                          ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' 
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border border-transparent hover:bg-slate-100 dark:hover:bg-slate-750'
                      }`}
                    >
                      <XCircle size={11} /> Absent
                    </button>

                    {/* Leave */}
                    <button
                      type="button"
                      onClick={() => handleStatusChange(staff.id, 'Leave')}
                      className={`py-1.5 px-3 rounded-xl font-bold text-[10px] uppercase flex items-center gap-1 cursor-pointer transition-all ${
                        currentStatus === 'Leave' 
                          ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border border-transparent hover:bg-slate-100 dark:hover:bg-slate-750'
                      }`}
                    >
                      <CalendarDays size={11} /> Leave
                    </button>

                    {/* Public Holiday */}
                    <button
                      type="button"
                      onClick={() => handleStatusChange(staff.id, 'Public Holiday')}
                      className={`py-1.5 px-3 rounded-xl font-bold text-[10px] uppercase flex items-center gap-1 cursor-pointer transition-all ${
                        currentStatus === 'Public Holiday' 
                          ? 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20' 
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border border-transparent hover:bg-slate-100 dark:hover:bg-slate-750'
                      }`}
                    >
                      <Bookmark size={11} /> Holiday
                    </button>
                  </div>

                  {/* Right: Check-In/Check-Out times or Remarks Notes */}
                  <div className="flex-1 lg:max-w-xs flex items-center gap-3">
                    {currentStatus === 'Present' ? (
                      <div className="flex items-center gap-2 w-full">
                        <div className="flex-1">
                          <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">In Time</label>
                          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-750 px-2 py-1 rounded-lg">
                            <Clock size={10} className="text-slate-400" />
                            <input 
                              type="text" 
                              value={record.checkIn || '09:00'}
                              onChange={(e) => handleTimeChange(staff.id, 'checkIn', e.target.value)}
                              placeholder="09:00"
                              className="bg-transparent w-full font-mono text-[10px] font-bold outline-none text-slate-800 dark:text-slate-200"
                            />
                          </div>
                        </div>
                        <div className="flex-1">
                          <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">Out Time</label>
                          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-750 px-2 py-1 rounded-lg">
                            <Clock size={10} className="text-slate-400" />
                            <input 
                              type="text" 
                              value={record.checkOut || '18:00'}
                              onChange={(e) => handleTimeChange(staff.id, 'checkOut', e.target.value)}
                              placeholder="18:00"
                              className="bg-transparent w-full font-mono text-[10px] font-bold outline-none text-slate-800 dark:text-slate-200"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full">
                        <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">Note / Log explanation</label>
                        <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-750 px-2 py-1 rounded-lg">
                          <FileText size={10} className="text-slate-400 shrink-0" />
                          <input 
                            type="text" 
                            value={record.notes || ''}
                            onChange={(e) => handleNotesChange(staff.id, e.target.value)}
                            placeholder="Enter notes..."
                            className="bg-transparent w-full text-[10px] font-semibold outline-none text-slate-700 dark:text-slate-300"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer actions */}
        <div className="bg-slate-50/50 dark:bg-slate-800/10 px-6 py-4 border-t border-slate-50 dark:border-slate-800 flex justify-end gap-3">
          <button
            type="button"
            onClick={handleSaveAll}
            className="btn py-2.5 px-5 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-lg shadow-blue-500/10 cursor-pointer text-xs"
          >
            <Save size={14} /> Save Day Attendance Register
          </button>
        </div>
      </div>

      {/* PUBLIC HOLIDAY MODAL DIALOG */}
      {showHolidayModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">Mark Official Public Holiday</h3>
            </div>
            <form onSubmit={handleMarkPublicHolidaySubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Holiday Title / Celebration</label>
                <input 
                  type="text" 
                  value={holidayName}
                  onChange={(e) => setHolidayName(e.target.value)}
                  placeholder="e.g. Onam / Independence Day"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-2.5 rounded-xl text-xs font-semibold"
                  required
                  autoFocus
                />
                <p className="text-[9px] text-slate-400 mt-1 font-semibold leading-relaxed">This pre-fills all listed personnel for the selected date as "Public Holiday".</p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowHolidayModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white flex items-center gap-1.5 cursor-pointer"
                >
                  Apply Preset
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

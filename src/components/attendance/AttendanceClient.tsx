'use client';

import { useState, useRef } from 'react';
import { MapPin, Camera, CheckCircle, Clock, Users, Loader2, LogIn, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate, cn } from '@/lib/utils';

interface AttendanceClientProps {
  userId: string;
  organizationId: string;
  role: string;
  userName: string;
  myAttendance: any;
  teamAttendance: any[];
  allUsers: any[];
}

export function AttendanceClient({
  userId,
  organizationId,
  role,
  userName,
  myAttendance,
  teamAttendance,
  allUsers,
}: AttendanceClientProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [attendance, setAttendance] = useState(myAttendance);
  const isAdmin = ['admin', 'sales_manager'].includes(role);

  const isCheckedIn = !!attendance?.check_in_time;
  const isCheckedOut = !!attendance?.check_out_time;

  async function getLocation(): Promise<{ lat: number; lng: number } | null> {
    return new Promise(resolve => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(null)
      );
    });
  }

  async function handleCheckIn() {
    setIsLoading(true);
    try {
      const location = await getLocation();

      const res = await fetch('/api/attendance/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          organizationId,
          lat: location?.lat,
          lng: location?.lng,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setAttendance({ ...attendance, check_in_time: new Date().toISOString() });
      toast.success('Checked in successfully! 📍');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Check-in failed');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCheckOut() {
    setIsLoading(true);
    try {
      const location = await getLocation();

      const res = await fetch('/api/attendance/check-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          lat: location?.lat,
          lng: location?.lng,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setAttendance({ ...attendance, check_out_time: new Date().toISOString() });
      toast.success('Checked out successfully!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Check-out failed');
    } finally {
      setIsLoading(false);
    }
  }

  const presentCount = teamAttendance.filter(a => a.check_in_time).length;
  const absentCount = allUsers.length - presentCount;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Attendance</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Check-in/out Panel */}
        <div className="lg:col-span-1">
          <div className="card p-6">
            <div className="text-center mb-6">
              <div className={cn(
                'w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-3 text-3xl',
                isCheckedOut ? 'bg-gray-100' :
                isCheckedIn ? 'bg-green-100' : 'bg-blue-100'
              )}>
                {isCheckedOut ? '🏠' : isCheckedIn ? '✅' : '👋'}
              </div>
              <h2 className="font-bold text-lg">{userName}</h2>
              <p className="text-sm text-muted-foreground">{new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>

            {/* Status */}
            {isCheckedIn && (
              <div className="p-3 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 mb-4">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400 text-sm font-medium">
                  <CheckCircle className="w-4 h-4" />
                  Checked in at {new Date(attendance.check_in_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </div>
                {attendance.check_in_location && (
                  <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-500 mt-1">
                    <MapPin className="w-3 h-3" />
                    Location captured
                  </div>
                )}
              </div>
            )}

            {isCheckedOut && (
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 mb-4">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm font-medium">
                  <Clock className="w-4 h-4" />
                  Checked out at {new Date(attendance.check_out_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            )}

            {/* Notes */}
            {!isCheckedOut && (
              <div className="mb-4">
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Add notes about your visit/work..."
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            )}

            {/* Action Button */}
            {!isCheckedOut && (
              <button
                onClick={isCheckedIn ? handleCheckOut : handleCheckIn}
                disabled={isLoading}
                className={cn(
                  'w-full py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all',
                  isCheckedIn
                    ? 'bg-orange-500 hover:bg-orange-600 text-white'
                    : 'bg-blue-900 hover:bg-blue-800 text-white',
                  isLoading && 'opacity-60 cursor-not-allowed'
                )}
              >
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                ) : isCheckedIn ? (
                  <><LogOut className="w-4 h-4" /> Check Out</>
                ) : (
                  <><LogIn className="w-4 h-4" /> Check In</>
                )}
              </button>
            )}

            {isCheckedOut && (
              <p className="text-center text-sm text-muted-foreground">
                Attendance recorded for today ✓
              </p>
            )}
          </div>
        </div>

        {/* Team Dashboard */}
        {isAdmin && (
          <div className="lg:col-span-2 space-y-4">
            {/* Team Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="card p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{presentCount}</div>
                <div className="text-xs text-muted-foreground mt-0.5">Present</div>
              </div>
              <div className="card p-4 text-center">
                <div className="text-2xl font-bold text-red-500">{absentCount}</div>
                <div className="text-xs text-muted-foreground mt-0.5">Absent</div>
              </div>
              <div className="card p-4 text-center">
                <div className="text-2xl font-bold text-orange-500">
                  {teamAttendance.filter(a => a.check_in_time && !a.check_out_time).length}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">On Duty</div>
              </div>
            </div>

            {/* Team List */}
            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <h2 className="font-semibold">Team Status - Today</h2>
              </div>
              <div className="divide-y divide-border">
                {allUsers.map(user => {
                  const att = teamAttendance.find(a => a.user_id === user.id);
                  const checkedIn = !!att?.check_in_time;
                  const checkedOut = !!att?.check_out_time;

                  return (
                    <div key={user.id} className="px-5 py-3 flex items-center gap-3 hover:bg-muted/30 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center text-sm font-bold text-blue-700 flex-shrink-0">
                        {user.full_name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{user.full_name}</div>
                        <div className="text-xs text-muted-foreground capitalize">{user.role?.replace(/_/g, ' ')}</div>
                      </div>
                      <div className="text-right">
                        {!checkedIn ? (
                          <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full font-medium">Absent</span>
                        ) : checkedOut ? (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">Done</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">On Duty</span>
                        )}
                        {checkedIn && att?.check_in_time && (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {new Date(att.check_in_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

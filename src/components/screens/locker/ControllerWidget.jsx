import React, { useState, useEffect } from 'react';
import { WidgetCard } from '../../ui';
import { useAppServices } from '../../../services/useAppServices';
import { Settings, Clock, User, Calendar } from 'lucide-react';

const ControllerWidget = () => {
  const { user, userData } = useAppServices();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 1) User's Name
  const userName = userData?.displayName || user?.displayName || 'User';

  // 2) Local Date and Time
  const formattedDate = currentTime.toLocaleDateString(undefined, { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  const formattedTime = currentTime.toLocaleTimeString();

  // 3) Release Group (Placeholder)
  const releaseGroup = "Alpha Group"; // To be setup later

  // 4) Current Week of Plan (Placeholder)
  const currentWeek = "Week 1"; // To be setup later

  return (
    <WidgetCard 
      title="Controller" 
      icon={Settings}
      accent="navy"
      className="mb-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* User Name */}
        <div className="flex items-center p-3 bg-slate-50 rounded-lg">
          <div className="p-2 bg-blue-100 rounded-full mr-3">
            <User className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase font-semibold">User</p>
            <p className="font-medium text-slate-900">{userName}</p>
          </div>
        </div>

        {/* Date & Time */}
        <div className="flex items-center p-3 bg-slate-50 rounded-lg">
          <div className="p-2 bg-green-100 rounded-full mr-3">
            <Clock className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase font-semibold">Local Time</p>
            <p className="font-medium text-slate-900">{formattedDate}</p>
            <p className="text-xs text-slate-600">{formattedTime}</p>
          </div>
        </div>

        {/* Release Group */}
        <div className="flex items-center p-3 bg-slate-50 rounded-lg">
          <div className="p-2 bg-purple-100 rounded-full mr-3">
            <Settings className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase font-semibold">Release Group</p>
            <p className="font-medium text-slate-900">{releaseGroup}</p>
          </div>
        </div>

        {/* Current Week */}
        <div className="flex items-center p-3 bg-slate-50 rounded-lg">
          <div className="p-2 bg-orange-100 rounded-full mr-3">
            <Calendar className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase font-semibold">Plan Progress</p>
            <p className="font-medium text-slate-900">{currentWeek}</p>
          </div>
        </div>
      </div>
    </WidgetCard>
  );
};

export default ControllerWidget;

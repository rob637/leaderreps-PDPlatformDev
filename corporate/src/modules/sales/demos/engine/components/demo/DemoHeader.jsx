import React from 'react';
import { demoUser, demoStats } from '../../data/demoUser';
import { Avatar } from '../ui';
import { Flame, Award } from 'lucide-react';

const DemoHeader = () => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo & Demo Badge */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <img src="/logo.svg" alt="LeaderReps" className="w-8 h-8" />
              <span className="font-bold text-gray-900">LeaderReps</span>
            </div>
            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded">
              DEMO
            </span>
          </div>

          {/* User Info */}
          <div className="flex items-center gap-4">
            {/* Streak */}
            <div className="flex items-center gap-1.5 text-sm">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="font-semibold text-gray-900">{demoStats.streakDays}</span>
              <span className="text-gray-500 hidden sm:inline">day streak</span>
            </div>

            {/* Day Counter */}
            <div className="flex items-center gap-1.5 text-sm">
              <Award className="w-4 h-4 text-primary-500" />
              <span className="font-semibold text-gray-900">Day {demoUser.currentDay}</span>
              <span className="text-gray-500 hidden sm:inline">of 70</span>
            </div>

            {/* Avatar */}
            <div className="flex items-center gap-2">
              <Avatar name={demoUser.name} size="sm" />
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{demoUser.firstName}</p>
                <p className="text-xs text-gray-500">{demoUser.role}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DemoHeader;

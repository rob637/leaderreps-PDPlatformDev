import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Target, CheckCircle2, Clock, Sun, Moon, BookOpen, Lightbulb } from 'lucide-react';
import { Card, Badge, ProgressBar, StatCard } from '../components/ui';
import { demoUser, demoStats, demoProgress, demoTodayFocus, leadershipIdentity } from '../data/demoUser';

const ArenaScreen = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-3xl font-bold text-navy-500 mb-2">
          The Arena
        </h1>
        <p className="text-gray-600">
          Your daily leadership training ground
        </p>
      </motion.div>

      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="p-6 bg-gradient-to-r from-navy-500 to-navy-600 text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-navy-200 text-sm mb-1">Good morning,</p>
              <h2 className="text-2xl font-bold mb-2">{demoUser.firstName}! 👋</h2>
              <p className="text-navy-200">
                Week {demoUser.currentWeek} of Foundation • {demoProgress.dayOfWeek}
              </p>
            </div>
            <div className="flex items-center gap-2 bg-white/20 rounded-lg px-3 py-2">
              <Flame className="w-5 h-5 text-orange-300" />
              <div>
                <p className="text-2xl font-bold">{demoStats.streakDays}</p>
                <p className="text-xs text-navy-200">day streak</p>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <StatCard 
          icon={<CheckCircle2 className="w-5 h-5" />}
          value={demoProgress.completedToday.length}
          label="Done today"
          color="teal"
        />
        <StatCard 
          icon={<Clock className="w-5 h-5" />}
          value={demoProgress.pendingToday.length}
          label="Remaining"
          color="orange"
        />
        <StatCard 
          icon={<Target className="w-5 h-5" />}
          value={demoStats.feedbackGiven}
          label="Feedback given"
          color="navy"
        />
        <StatCard 
          icon={<BookOpen className="w-5 h-5" />}
          value={demoStats.journalEntries}
          label="Journal entries"
          color="teal"
        />
      </motion.div>

      {/* Daily Practice */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid md:grid-cols-2 gap-6"
      >
        {/* Morning Bookend */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Sun className="w-5 h-5 text-orange-500" />
            <h3 className="font-semibold text-navy-500">Morning Practice</h3>
            <Badge variant="success">Complete</Badge>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-teal-50 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-teal-600" />
              <div>
                <p className="font-medium text-navy-500">Set Your Intention</p>
                <p className="text-sm text-gray-500">How will you show up as a leader today?</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-teal-50 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-teal-600" />
              <div>
                <p className="font-medium text-navy-500">Daily Leadership Tip</p>
                <p className="text-sm text-gray-500">2-minute micro-learning</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Evening Bookend */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Moon className="w-5 h-5 text-navy-500" />
            <h3 className="font-semibold text-navy-500">Evening Reflection</h3>
            <Badge variant="warning">Pending</Badge>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
              <div>
                <p className="font-medium text-navy-500">Journal Entry</p>
                <p className="text-sm text-gray-500">Reflect on today's leadership moments</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
              <div>
                <p className="font-medium text-navy-500">Tomorrow's Focus</p>
                <p className="text-sm text-gray-500">Preview and prepare</p>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Today's Focus */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <Card className="p-5 border-l-4 border-teal-500">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-5 h-5 text-teal-600" />
            <h3 className="font-semibold text-navy-500">Today's Focus: {demoTodayFocus.skill}</h3>
          </div>
          <p className="text-gray-600 mb-4">{demoTodayFocus.tip}</p>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-2">
              <strong>Action:</strong> {demoTodayFocus.action}
            </p>
            <blockquote className="text-sm italic text-gray-500 border-l-2 border-teal-300 pl-3 mt-3">
              "{demoTodayFocus.quote.text}"
              <cite className="block text-xs mt-1 not-italic text-teal-600">— {demoTodayFocus.quote.author}</cite>
            </blockquote>
          </div>
        </Card>
      </motion.div>

      {/* Leadership Identity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="p-5 bg-navy-50">
          <h3 className="font-semibold text-navy-500 mb-3">🎯 Your Leadership Identity Statement</h3>
          <blockquote className="text-lg text-navy-600 italic mb-4">
            "{leadershipIdentity.statement}"
          </blockquote>
          <div className="flex flex-wrap gap-2">
            {leadershipIdentity.qualities.map((quality, i) => (
              <span key={i} className="px-3 py-1 bg-white rounded-full text-sm text-navy-600 border border-navy-200">
                {quality}
              </span>
            ))}
          </div>
          <p className="text-sm text-teal-600 mt-3">
            Focus phrase: <strong>{leadershipIdentity.focusPhrase}</strong>
          </p>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default ArenaScreen;

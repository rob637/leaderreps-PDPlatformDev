import React from 'react';
import { motion } from 'framer-motion';
import { 
  Flame, 
  Target, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  Play,
  BookOpen,
  Award,
  Calendar,
  ChevronRight
} from 'lucide-react';
import { Card, ProgressBar, Badge } from '../components/ui';
import { demoUser, demoStats, demoProgress, demoSkills, demoTodayFocus } from '../data/demoUser';

const DashboardScreen = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Welcome Banner */}
      <motion.div variants={itemVariants}>
        <Card className="p-6 bg-gradient-to-r from-primary-500 to-primary-600 text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-primary-100 text-sm mb-1">Good morning,</p>
              <h1 className="text-2xl font-bold mb-2">{demoUser.firstName}! 👋</h1>
              <p className="text-primary-100">
                Day {demoUser.currentDay} of your leadership journey • Week {demoUser.currentWeek}
              </p>
            </div>
            <div className="flex items-center gap-2 bg-white/20 rounded-lg px-3 py-2">
              <Flame className="w-5 h-5 text-orange-300" />
              <div>
                <p className="text-2xl font-bold">{demoStats.streakDays}</p>
                <p className="text-xs text-primary-100">day streak</p>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Quick Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 pulse-glow">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{demoProgress.completedToday.length}</p>
              <p className="text-xs text-gray-500">Done today</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{demoProgress.pendingToday.length}</p>
              <p className="text-xs text-gray-500">Remaining</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Award className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{demoStats.achievementsEarned}</p>
              <p className="text-xs text-gray-500">Achievements</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{demoProgress.overallPercent}%</p>
              <p className="text-xs text-gray-500">Complete</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Today's Focus */}
      <motion.div variants={itemVariants}>
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary-600" />
              <h2 className="font-semibold text-gray-900">Today's Focus</h2>
            </div>
            <Badge variant="primary">{demoTodayFocus.skill.name}</Badge>
          </div>
          
          <div className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-xl p-4 mb-4">
            <p className="text-sm text-gray-600 mb-2">💡 Leadership Tip</p>
            <p className="font-medium text-gray-900">{demoTodayFocus.tip.title}</p>
            <p className="text-sm text-gray-600 mt-1">{demoTodayFocus.tip.content}</p>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <p className="text-sm text-gray-500 italic">
              "{demoTodayFocus.quote.text}"
            </p>
            <p className="text-xs text-gray-400 mt-1">— {demoTodayFocus.quote.author}</p>
          </div>
        </Card>
      </motion.div>

      {/* Today's Activities */}
      <motion.div variants={itemVariants}>
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-primary-600" />
            <h2 className="font-semibold text-gray-900">Today's Activities</h2>
          </div>

          {/* Completed */}
          <div className="space-y-2 mb-4">
            {demoProgress.completedToday.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <span className="text-gray-700 flex-1">{item.label}</span>
                <span className="text-xs text-gray-400">{item.time}</span>
              </div>
            ))}
          </div>

          {/* Pending */}
          <div className="space-y-2">
            {demoProgress.pendingToday.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
                <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                <span className="text-gray-700 flex-1">{item.label}</span>
                <span className="text-xs text-gray-400">{item.estimate}</span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Skills Progress */}
      <motion.div variants={itemVariants}>
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary-600" />
              <h2 className="font-semibold text-gray-900">Skills Progress</h2>
            </div>
            <span className="text-sm text-primary-600 cursor-pointer hover:underline">
              View all →
            </span>
          </div>

          <div className="space-y-4">
            {demoSkills.slice(0, 3).map((skill) => (
              <div key={skill.id}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{skill.name}</span>
                    <Badge variant="default" size="sm">Level {skill.level}</Badge>
                  </div>
                  <span className="text-sm text-gray-500">{skill.progress}%</span>
                </div>
                <ProgressBar 
                  value={skill.progress} 
                  color={skill.progress > 70 ? 'green' : skill.progress > 40 ? 'primary' : 'amber'} 
                />
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
        <Card hover className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary-100 rounded-xl">
              <Play className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Watch Video</p>
              <p className="text-xs text-gray-500">Continue learning</p>
            </div>
          </div>
        </Card>
        <Card hover className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-xl">
              <BookOpen className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Browse Content</p>
              <p className="text-xs text-gray-500">Explore library</p>
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default DashboardScreen;

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Map, 
  Flag, 
  CheckCircle2, 
  Circle,
  Lock,
  Trophy,
  Star,
  ChevronRight,
  Calendar,
  Target,
  Sparkles,
  Award
} from 'lucide-react';
import { Card, Button, Badge, ProgressBar } from '../components/ui';
import { demoUser, demoProgress, demoAchievements } from '../data/demoUser';

const RoadmapScreen = () => {
  const [expandedPhase, setExpandedPhase] = useState(1);

  const phases = [
    {
      id: 0,
      name: 'Week 0: Preparation',
      days: '1-7',
      status: 'completed',
      description: 'Setting intentions and establishing your baseline',
      milestones: [
        { name: 'Complete PDQ Assessment', completed: true },
        { name: 'Set 3-Month Goals', completed: true },
        { name: 'Watch Orientation Videos', completed: true },
        { name: 'First Journal Entry', completed: true },
      ],
      color: '#10B981'
    },
    {
      id: 1,
      name: 'Weeks 1-2: Foundation',
      days: '8-21',
      status: 'current',
      description: 'Building core leadership habits',
      milestones: [
        { name: 'Daily Practice Streak (7 days)', completed: true },
        { name: 'Complete Communication Module', completed: true },
        { name: 'First Skill to 25%', completed: true },
        { name: 'Team Feedback Session', completed: false },
      ],
      color: '#3B82F6',
      progress: 75
    },
    {
      id: 2,
      name: 'Weeks 3-4: Growth',
      days: '22-35',
      status: 'upcoming',
      description: 'Deepening your practice and expanding skills',
      milestones: [
        { name: 'Two Skills at 50%', completed: false },
        { name: 'Lead a Team Meeting', completed: false },
        { name: 'Complete Decision Making Module', completed: false },
        { name: '30-Day Streak', completed: false },
      ],
      color: '#8B5CF6'
    },
    {
      id: 3,
      name: 'Weeks 5-6: Mastery',
      days: '36-49',
      status: 'locked',
      description: 'Advanced techniques and integration',
      milestones: [
        { name: 'Three Skills at 75%', completed: false },
        { name: 'Mentor a Peer', completed: false },
        { name: 'Complete Delegation Module', completed: false },
        { name: 'Receive 360 Feedback', completed: false },
      ],
      color: '#F59E0B'
    },
    {
      id: 4,
      name: 'Weeks 7-8: Integration',
      days: '50-63',
      status: 'locked',
      description: 'Integrating learnings into daily leadership',
      milestones: [
        { name: 'All Skills at 80%+', completed: false },
        { name: 'Create Personal Leadership Plan', completed: false },
        { name: 'Team Impact Presentation', completed: false },
        { name: 'Final Reflection', completed: false },
      ],
      color: '#EC4899'
    },
    {
      id: 5,
      name: 'Week 9-10: Graduation',
      days: '64-70',
      status: 'locked',
      description: 'Celebrating achievements and planning ahead',
      milestones: [
        { name: 'Complete Final Assessment', completed: false },
        { name: 'Graduation Ceremony', completed: false },
        { name: 'Set 6-Month Goals', completed: false },
        { name: 'Join Alumni Network', completed: false },
      ],
      color: '#6366F1'
    },
  ];

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
      {/* Header */}
      <motion.div variants={itemVariants}>
        <Card className="p-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
          <div className="flex items-center gap-3 mb-4">
            <Map className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">Your Leadership Journey</h1>
              <p className="text-indigo-200">70 Days to Transform Your Leadership</p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="text-center p-3 bg-white/10 rounded-lg">
              <p className="text-2xl font-bold">{demoUser.currentDay}</p>
              <p className="text-xs text-indigo-200">Days In</p>
            </div>
            <div className="text-center p-3 bg-white/10 rounded-lg">
              <p className="text-2xl font-bold">{70 - demoUser.currentDay}</p>
              <p className="text-xs text-indigo-200">Days Left</p>
            </div>
            <div className="text-center p-3 bg-white/10 rounded-lg">
              <p className="text-2xl font-bold">{Math.round((demoUser.currentDay / 70) * 100)}%</p>
              <p className="text-xs text-indigo-200">Complete</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Overall Progress */}
      <motion.div variants={itemVariants}>
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-gray-900">Overall Progress</span>
            <span className="text-primary-600 font-semibold">{Math.round((demoUser.currentDay / 70) * 100)}%</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(demoUser.currentDay / 70) * 100}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full"
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-500">Day 1</span>
            <span className="text-xs text-gray-500">Day 70</span>
          </div>
        </Card>
      </motion.div>

      {/* Achievements Unlocked */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            Achievements Unlocked
          </h2>
          <Badge variant="accent">{demoAchievements.length} / 20</Badge>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {demoAchievements.map((achievement, index) => (
            <motion.div
              key={achievement.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="flex-shrink-0"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center text-2xl shadow-lg">
                {achievement.icon}
              </div>
            </motion.div>
          ))}
          <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Lock className="w-6 h-6 text-gray-400" />
          </div>
        </div>
      </motion.div>

      {/* Journey Phases */}
      <motion.div variants={itemVariants}>
        <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Flag className="w-5 h-5 text-primary-600" />
          Journey Phases
        </h2>
        <div className="space-y-3">
          {phases.map((phase, index) => (
            <Card 
              key={phase.id}
              className={`overflow-hidden transition-all cursor-pointer ${
                phase.status === 'locked' ? 'opacity-60' : ''
              }`}
              onClick={() => phase.status !== 'locked' && setExpandedPhase(expandedPhase === phase.id ? -1 : phase.id)}
            >
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <div 
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
                      phase.status === 'completed' ? 'bg-green-500' :
                      phase.status === 'current' ? '' :
                      'bg-gray-300'
                    }`}
                    style={phase.status === 'current' ? { backgroundColor: phase.color } : {}}
                  >
                    {phase.status === 'completed' ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : phase.status === 'locked' ? (
                      <Lock className="w-4 h-4" />
                    ) : (
                      <span className="font-bold">{phase.id + 1}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{phase.name}</h3>
                      {phase.status === 'current' && (
                        <Badge variant="primary" size="sm">Current</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">Days {phase.days}</p>
                  </div>
                  {phase.status !== 'locked' && (
                    <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${
                      expandedPhase === phase.id ? 'rotate-90' : ''
                    }`} />
                  )}
                </div>

                {phase.progress !== undefined && (
                  <div className="mt-3">
                    <ProgressBar value={phase.progress} showValue />
                  </div>
                )}
              </div>

              {/* Expanded Content */}
              {expandedPhase === phase.id && phase.status !== 'locked' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-gray-100 bg-gray-50 p-4"
                >
                  <p className="text-sm text-gray-600 mb-3">{phase.description}</p>
                  <div className="space-y-2">
                    {phase.milestones.map((milestone, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        {milestone.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <Circle className="w-4 h-4 text-gray-300" />
                        )}
                        <span className={`text-sm ${
                          milestone.completed ? 'text-gray-900' : 'text-gray-500'
                        }`}>
                          {milestone.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </Card>
          ))}
        </div>
      </motion.div>

      {/* Next Milestone */}
      <motion.div variants={itemVariants}>
        <Card className="p-4 bg-primary-50 border-primary-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-full">
              <Target className="w-5 h-5 text-primary-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-primary-600 font-medium">Next Milestone</p>
              <p className="font-semibold text-gray-900">Team Feedback Session</p>
            </div>
            <Button variant="primary" size="sm">Start</Button>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default RoadmapScreen;

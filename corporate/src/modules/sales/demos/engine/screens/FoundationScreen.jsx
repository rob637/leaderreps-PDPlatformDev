import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, Calendar, BookOpen, Play, Users } from 'lucide-react';
import { Card, Badge, ProgressBar } from '../components/ui';
import { foundationSessions, clearFramework, demoUser, demoStats } from '../data/demoUser';

const FoundationScreen = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header with Progress */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-2xl p-6 text-white"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <Badge className="bg-white/20 text-white mb-2">Foundation • Week {demoUser.currentWeek} of 8</Badge>
            <h1 className="text-2xl font-bold mb-1">8-Week Foundation Program</h1>
            <p className="text-teal-100">Live weekly sessions that build your leadership core</p>
          </div>
          <div className="bg-white/20 rounded-xl p-4 min-w-[200px]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm">Progress</span>
              <span className="font-bold">{demoStats.sessionsCompleted}/4 Sessions</span>
            </div>
            <ProgressBar value={demoStats.sessionsCompleted} max={4} color="navy" />
          </div>
        </div>
      </motion.div>

      {/* Foundation Sessions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-xl font-semibold text-navy-500 mb-4">The 4 Core Sessions</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {foundationSessions.map((session, index) => (
            <Card 
              key={session.id} 
              className={`p-5 ${session.status === 'upcoming' ? 'border-2 border-orange-300 bg-orange-50/50' : ''}`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl text-2xl ${
                  session.status === 'completed' ? 'bg-teal-100' : 'bg-orange-100'
                }`}>
                  {session.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-500">Session {session.id}</span>
                    {session.status === 'completed' ? (
                      <Badge variant="success">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Completed
                      </Badge>
                    ) : (
                      <Badge variant="warning">
                        <Clock className="w-3 h-3 mr-1" />
                        Upcoming
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-semibold text-navy-500 mb-1">{session.title}</h3>
                  <p className="text-sm text-teal-600 mb-2">{session.subtitle}</p>
                  <p className="text-sm text-gray-600 mb-3">{session.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {session.keyTopics.map((topic, i) => (
                      <span key={i} className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </motion.div>

      {/* CLEAR Framework Highlight */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="p-6 border-l-4 border-navy-500">
          <h2 className="text-xl font-semibold text-navy-500 mb-4 flex items-center gap-2">
            💬 {clearFramework.title}
          </h2>
          <p className="text-gray-600 mb-4">
            The core feedback framework you'll master during Foundation. Use it for both reinforcing and redirecting feedback.
          </p>
          <div className="grid md:grid-cols-5 gap-3">
            {clearFramework.steps.map((step, i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="w-10 h-10 rounded-full bg-navy-500 text-white flex items-center justify-center mx-auto mb-2 font-bold text-lg">
                  {step.letter}
                </div>
                <p className="font-semibold text-navy-500 text-sm">{step.word}</p>
                <p className="text-xs text-gray-500 mt-1">{step.description}</p>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* What's Included */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid md:grid-cols-3 gap-4"
      >
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-teal-100 rounded-lg">
              <Users className="w-5 h-5 text-teal-600" />
            </div>
            <h3 className="font-semibold text-navy-500">Live Cohort Sessions</h3>
          </div>
          <p className="text-sm text-gray-600">
            90-minute interactive sessions with your cohort. Practice scenarios, breakout discussions, and real-time coaching.
          </p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-navy-100 rounded-lg">
              <BookOpen className="w-5 h-5 text-navy-600" />
            </div>
            <h3 className="font-semibold text-navy-500">Companion Workbook</h3>
          </div>
          <p className="text-sm text-gray-600">
            Structured exercises, reflection prompts, and frameworks to prepare for each session and apply learnings.
          </p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Play className="w-5 h-5 text-orange-600" />
            </div>
            <h3 className="font-semibold text-navy-500">Pre-Session Videos</h3>
          </div>
          <p className="text-sm text-gray-600">
            Short prep videos to introduce concepts before each live session, maximizing your learning time.
          </p>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default FoundationScreen;

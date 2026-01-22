import React from 'react';
import { motion } from 'framer-motion';
import { Video, Users, MessageSquare, Clock, Calendar, CheckSquare } from 'lucide-react';
import { Card, Badge, Avatar } from '../components/ui';
import { cohortMembers, demoUser } from '../data/demoUser';

const LiveSessionScreen = () => {
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
          Live Cohort Sessions
        </h1>
        <p className="text-gray-600">
          Weekly 90-minute sessions where real learning happens
        </p>
      </motion.div>

      {/* Session Preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="overflow-hidden">
          {/* Video Preview Area */}
          <div className="bg-navy-500 aspect-video relative flex items-center justify-center">
            <div className="text-center text-white p-8">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
                <Video className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Session 4: Building Vulnerability-Based Trust</h3>
              <p className="text-navy-200">Next session: Monday, Jan 13 at 10:00 AM EST</p>
            </div>
            {/* Simulated participant gallery */}
            <div className="absolute bottom-4 right-4 flex -space-x-2">
              {cohortMembers.slice(0, 4).map((member, i) => (
                <div key={i} className="w-10 h-10 rounded-full bg-teal-500 border-2 border-white flex items-center justify-center text-lg">
                  {member.avatar}
                </div>
              ))}
              <div className="w-10 h-10 rounded-full bg-navy-400 border-2 border-white flex items-center justify-center text-white text-xs font-medium">
                +8
              </div>
            </div>
          </div>
          
          {/* Session Info */}
          <div className="p-6">
            <div className="flex flex-wrap gap-4 mb-4">
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="w-4 h-4" />
                <span>90 minutes</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Users className="w-4 h-4" />
                <span>12 participants</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <MessageSquare className="w-4 h-4" />
                <span>Breakout rooms included</span>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Session Structure */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-xl font-semibold text-navy-500 mb-4">What Happens in a Live Session</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { time: '0-10 min', title: 'Connection', desc: 'Good news sharing, grounding rep, set intention', icon: '👋' },
            { time: '10-30 min', title: 'Concept Review', desc: 'Review pre-work concepts, discuss questions', icon: '📚' },
            { time: '30-70 min', title: 'Workout', desc: 'Breakout practice with real scenarios', icon: '💪' },
            { time: '70-90 min', title: 'Wind Down', desc: 'Reflections, commitments, homework', icon: '🎯' },
          ].map((phase, i) => (
            <Card key={i} className="p-4">
              <div className="text-2xl mb-2">{phase.icon}</div>
              <Badge variant="info" className="mb-2">{phase.time}</Badge>
              <h3 className="font-semibold text-navy-500 mb-1">{phase.title}</h3>
              <p className="text-sm text-gray-600">{phase.desc}</p>
            </Card>
          ))}
        </div>
      </motion.div>

      {/* Your Cohort */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-navy-500 mb-4">Your {demoUser.cohortName}</h2>
          <p className="text-gray-600 mb-4">
            Learn alongside peers who share your challenges. Build relationships that extend beyond the program.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {cohortMembers.map((member, i) => (
              <div key={i} className="text-center">
                <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-2xl mx-auto mb-2">
                  {member.avatar}
                </div>
                <p className="font-medium text-navy-500 text-sm">{member.name.split(' ')[0]}</p>
                <p className="text-xs text-gray-500">{member.role}</p>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Key Benefits */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-teal-50 rounded-xl p-6"
      >
        <h3 className="font-semibold text-navy-500 mb-4">Why Live Sessions Matter</h3>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { title: 'Practice, Not Just Theory', desc: 'Role-play real scenarios with feedback from trainers and peers' },
            { title: 'Accountability', desc: 'Weekly touchpoints keep you on track and committed to growth' },
            { title: 'Peer Learning', desc: 'Learn from others\' challenges and successes in similar roles' },
          ].map((benefit, i) => (
            <div key={i} className="flex items-start gap-3">
              <CheckSquare className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-navy-500">{benefit.title}</p>
                <p className="text-sm text-gray-600">{benefit.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default LiveSessionScreen;

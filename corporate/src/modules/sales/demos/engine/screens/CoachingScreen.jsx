import React from 'react';
import { motion } from 'framer-motion';
import { UserCheck, Target, MessageSquare, Star, Calendar, Award, CheckCircle2 } from 'lucide-react';
import { Card, Badge, ProgressBar } from '../components/ui';
import { demoUser } from '../data/demoUser';

const CoachingScreen = () => {
  const coachingMilestones = [
    { week: 1, topic: 'Leadership Assessment Review', completed: true },
    { week: 3, topic: 'CLEAR Framework Application', completed: true },
    { week: 5, topic: 'Leadership Identity Refinement', completed: false },
    { week: 7, topic: 'Growth Plan Development', completed: false },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <h1 className="text-3xl font-bold text-navy-500 mb-2">Coaching</h1>
        <p className="text-gray-600">Personalized guidance for your leadership journey</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
            <UserCheck className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-1">🎯 Coaching Pillar</h2>
            <p className="text-orange-100">Expert trainers who guide your development with personalized feedback, accountability, and strategic insights.</p>
          </div>
        </div>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="p-5">
            <h3 className="font-semibold text-navy-500 mb-4 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-orange-500" />
              Your Trainer
            </h3>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-navy-500 to-navy-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                RY
              </div>
              <div>
                <h4 className="font-semibold text-navy-500">Ryan Yeoman</h4>
                <p className="text-sm text-gray-500">Leadership Development Expert</p>
                <div className="flex items-center gap-1 mt-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600">20+ years developing leaders. Expert in feedback frameworks, team dynamics, and executive coaching.</p>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="p-5">
            <h3 className="font-semibold text-navy-500 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-500" />
              1:1 Coaching Sessions
            </h3>
            <div className="space-y-3">
              {coachingMilestones.map((milestone, i) => (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-lg ${milestone.completed ? 'bg-green-50' : 'bg-gray-50'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${milestone.completed ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                    {milestone.completed ? <CheckCircle2 className="w-5 h-5" /> : milestone.week}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${milestone.completed ? 'text-green-700' : 'text-gray-700'}`}>Week {milestone.week}</p>
                    <p className="text-xs text-gray-500">{milestone.topic}</p>
                  </div>
                  {i === 2 && <Badge variant="warning">Next</Badge>}
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card className="p-5">
          <h3 className="font-semibold text-navy-500 mb-4">Coaching Features</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { icon: <MessageSquare className="w-5 h-5" />, title: 'Personalized Feedback', desc: 'Direct feedback on your leadership behaviors and growth' },
              { icon: <Target className="w-5 h-5" />, title: 'Goal Setting', desc: 'Work with your trainer to set and achieve meaningful goals' },
              { icon: <Award className="w-5 h-5" />, title: 'Accountability', desc: 'Regular check-ins to keep you on track and motivated' },
            ].map((feature, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="p-2 bg-orange-100 rounded-lg text-orange-600">{feature.icon}</div>
                <div>
                  <p className="font-medium text-navy-500">{feature.title}</p>
                  <p className="text-sm text-gray-600">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="bg-navy-50 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-orange-100 rounded-xl">
            <MessageSquare className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h3 className="font-semibold text-navy-500 mb-2">Recent Trainer Feedback</h3>
            <p className="text-gray-600 italic">"Alex, your application of CLEAR feedback in your 1:1s has shown remarkable improvement. Your team is responding positively. Next, let's focus on applying these skills in larger group settings."</p>
            <p className="text-sm text-gray-500 mt-2">— Ryan Yeoman, Week 3 Session</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CoachingScreen;

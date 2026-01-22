import React from 'react';
import { motion } from 'framer-motion';
import { Rocket, TrendingUp, RefreshCw, Users, BookOpen, UserCheck, Zap, Calendar, Star } from 'lucide-react';
import { Card, Badge, ProgressBar } from '../components/ui';

const AscentScreen = () => {
  const weeklyChallenge = {
    title: "The Recognition Challenge",
    description: "Give specific, meaningful recognition to 3 team members this week using the 5:1 Magic Ratio principles.",
    daysLeft: 4,
    progress: 67,
    participants: 847,
  };

  const ascentFeatures = [
    { icon: <RefreshCw className="w-6 h-6" />, title: 'Fresh Content Weekly', desc: 'New videos, articles, and tools added every week to keep your growth ongoing' },
    { icon: <Calendar className="w-6 h-6" />, title: 'Monthly Challenges', desc: 'Themed challenges to practice and apply specific leadership skills' },
    { icon: <Users className="w-6 h-6" />, title: 'Community Access', desc: "Continue connecting with your cohort and the broader Leaders' Circle" },
    { icon: <UserCheck className="w-6 h-6" />, title: 'Ongoing Coaching', desc: 'Quarterly 1:1 sessions with your trainer plus group coaching calls' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <h1 className="text-3xl font-bold text-navy-500 mb-2">Ascent</h1>
        <p className="text-gray-600">Continue your leadership journey with ongoing growth</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-gradient-to-r from-navy-500 via-navy-600 to-teal-600 rounded-xl p-6 text-white">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
            <Rocket className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-1">🚀 The Ascent Phase</h2>
            <p className="text-white/80">After completing Foundation, continue your growth with full Arena access</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="text-center p-3 bg-white/10 rounded-lg">
            <p className="text-2xl font-bold">∞</p>
            <p className="text-sm text-white/80">Content Access</p>
          </div>
          <div className="text-center p-3 bg-white/10 rounded-lg">
            <p className="text-2xl font-bold">12+</p>
            <p className="text-sm text-white/80">Monthly Challenges</p>
          </div>
          <div className="text-center p-3 bg-white/10 rounded-lg">
            <p className="text-2xl font-bold">4</p>
            <p className="text-sm text-white/80">1:1 Sessions/Year</p>
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="p-5 border-2 border-orange-200 bg-orange-50/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-navy-500 flex items-center gap-2">
              <Zap className="w-5 h-5 text-orange-500" />
              This Week's Challenge
            </h3>
            <Badge variant="warning">{weeklyChallenge.daysLeft} days left</Badge>
          </div>
          <h4 className="text-lg font-medium text-navy-600 mb-2">{weeklyChallenge.title}</h4>
          <p className="text-sm text-gray-600 mb-4">{weeklyChallenge.description}</p>
          <div className="mb-2">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Your Progress</span>
              <span className="font-medium text-teal-600">{weeklyChallenge.progress}%</span>
            </div>
            <ProgressBar value={weeklyChallenge.progress} />
          </div>
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <Users className="w-3 h-3" />
            {weeklyChallenge.participants} leaders participating
          </p>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="p-5">
          <h3 className="font-semibold text-navy-500 mb-4">What's Included in Ascent</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {ascentFeatures.map((feature, i) => (
              <div key={i} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <div className="p-2 bg-navy-100 rounded-lg text-navy-600">{feature.icon}</div>
                <div>
                  <p className="font-medium text-navy-500">{feature.title}</p>
                  <p className="text-sm text-gray-600">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="bg-gradient-to-r from-teal-50 to-navy-50 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="w-6 h-6 text-teal-600" />
          <h3 className="font-semibold text-navy-500">The Foundation → Ascent Journey</h3>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-1 text-center p-4 bg-white rounded-lg shadow-sm">
            <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <BookOpen className="w-6 h-6 text-teal-600" />
            </div>
            <p className="font-medium text-navy-500">Foundation</p>
            <p className="text-xs text-gray-500">8 Weeks Intensive</p>
          </div>
          <div className="text-2xl text-gray-300">→</div>
          <div className="flex-1 text-center p-4 bg-white rounded-lg shadow-sm border-2 border-teal-400">
            <div className="w-12 h-12 bg-navy-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Rocket className="w-6 h-6 text-navy-600" />
            </div>
            <p className="font-medium text-navy-500">Ascent</p>
            <p className="text-xs text-gray-500">Ongoing Growth</p>
            <Badge variant="success" className="mt-1">Full Access</Badge>
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="text-center bg-navy-500 rounded-xl p-6 text-white">
        <Star className="w-8 h-8 mx-auto mb-3 text-yellow-400" />
        <h3 className="font-semibold text-lg mb-2">Leadership is a Lifelong Journey</h3>
        <p className="text-navy-100 max-w-2xl mx-auto">Ascent ensures you never stop growing. With constantly updated content, ongoing challenges, and continued community support, your leadership development continues long after Foundation.</p>
      </motion.div>
    </motion.div>
  );
};

export default AscentScreen;

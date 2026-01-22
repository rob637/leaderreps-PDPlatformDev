import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Users, BookOpen, Target } from 'lucide-react';
import { Button, PillarCard } from '../components/ui';

const WelcomeScreen = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-8"
      >
        <img 
          src="/logo.svg" 
          alt="LeaderReps" 
          className="h-16 mx-auto mb-6"
        />
        <h1 className="text-4xl md:text-5xl font-bold text-navy-500 mb-4">
          Build Exceptional Leaders
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-2">
          A proven system that transforms managers into confident, effective leaders
        </p>
        <p className="text-lg text-teal-600 font-medium">
          One rep at a time.
        </p>
      </motion.div>

      {/* Value Proposition */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-r from-navy-500 to-navy-600 rounded-2xl p-8 text-white"
      >
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-semibold mb-4">
            Leadership is a skill that can be trained
          </h2>
          <p className="text-navy-100 text-lg mb-6">
            Just like athletes build strength through consistent practice, leaders develop through intentional "reps" — 
            daily moments of feedback, coaching, and self-reflection that compound over time.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-teal-400 rounded-full"></span>
              <span>8-Week Foundation Program</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-teal-400 rounded-full"></span>
              <span>Live Cohort Sessions</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-teal-400 rounded-full"></span>
              <span>Ongoing Ascent Development</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Three Pillars */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="text-2xl font-semibold text-navy-500 text-center mb-6">
          Our Three Pillars
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <PillarCard
            icon={<Users className="w-7 h-7" />}
            title="Community"
            description="Learn alongside peers in your cohort. Share challenges, celebrate wins, and build lasting professional relationships."
            color="teal"
            items={[
              'Live cohort sessions',
              'Peer accountability',
              'Leaders Circle forums',
              'Networking opportunities'
            ]}
          />
          <PillarCard
            icon={<BookOpen className="w-7 h-7" />}
            title="Content"
            description="Access a rich library of videos, articles, tools, and frameworks designed for practical application."
            color="navy"
            items={[
              'Video lessons',
              'Read & Rep articles',
              'Leadership tools',
              'Daily micro-learning'
            ]}
          />
          <PillarCard
            icon={<Target className="w-7 h-7" />}
            title="Coaching"
            description="Receive personalized guidance from experienced trainers who help you apply concepts to your real challenges."
            color="orange"
            items={[
              '1:1 coaching sessions',
              'Personalized feedback',
              'Action planning',
              'Ongoing support'
            ]}
          />
        </div>
      </motion.div>

      {/* Quote */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-center py-6 border-t border-b border-gray-200"
      >
        <blockquote className="text-xl italic text-gray-600 mb-2">
          "Exceptional leaders are built moment by moment, one rep at a time."
        </blockquote>
        <cite className="text-teal-600 font-medium">— LeaderReps</cite>
      </motion.div>
    </motion.div>
  );
};

export default WelcomeScreen;

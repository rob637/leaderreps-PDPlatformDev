import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sun, 
  Target, 
  Lightbulb, 
  CheckCircle2,
  Circle,
  Sparkles,
  Quote
} from 'lucide-react';
import { Card, Button, Badge, Checkbox } from '../components/ui';
import { demoUser, demoTodayFocus, demoProgress } from '../data/demoUser';

const DailyPracticeScreen = () => {
  const [completedItems, setCompletedItems] = useState({
    intention: false,
    tip: true,
    skillFocus: false,
  });
  const [intention, setIntention] = useState('');
  const [showCelebration, setShowCelebration] = useState(false);

  const handleComplete = (item) => {
    setCompletedItems(prev => ({ ...prev, [item]: true }));
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 1500);
  };

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
      {/* Celebration Animation */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed inset-0 flex items-center justify-center pointer-events-none z-50"
          >
            <div className="text-6xl animate-bounce">🎉</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Morning Header */}
      <motion.div variants={itemVariants}>
        <Card className="p-6 bg-gradient-to-r from-amber-400 to-orange-500 text-white">
          <div className="flex items-center gap-3 mb-2">
            <Sun className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">Good Morning, {demoUser.firstName}!</h1>
              <p className="text-amber-100">Day {demoUser.currentDay} • Let's make it count</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Today's Focus Skill */}
      <motion.div variants={itemVariants}>
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-primary-600" />
            <h2 className="font-semibold text-gray-900">Today's Skill Focus</h2>
            <Badge variant="primary">{demoTodayFocus.skill.name}</Badge>
          </div>

          <div className="flex items-center gap-4 p-4 bg-primary-50 rounded-xl">
            <div 
              className="w-16 h-16 rounded-xl flex items-center justify-center text-white text-2xl font-bold"
              style={{ backgroundColor: demoTodayFocus.skill.color }}
            >
              {demoTodayFocus.skill.progress}%
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">{demoTodayFocus.skill.name}</p>
              <p className="text-sm text-gray-600">{demoTodayFocus.skill.description}</p>
              <p className="text-xs text-primary-600 mt-1">
                Level {demoTodayFocus.skill.level} • {demoTodayFocus.skill.levelName}
              </p>
            </div>
            {completedItems.skillFocus ? (
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            ) : (
              <Button 
                variant="primary" 
                size="sm"
                onClick={() => handleComplete('skillFocus')}
              >
                Practice
              </Button>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Morning Intention */}
      <motion.div variants={itemVariants}>
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h2 className="font-semibold text-gray-900">Morning Intention</h2>
            </div>
            {completedItems.intention && (
              <Badge variant="success">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Set
              </Badge>
            )}
          </div>

          <p className="text-gray-600 mb-3">{demoTodayFocus.intention.prompt}</p>

          <div className="relative">
            <textarea
              value={intention}
              onChange={(e) => setIntention(e.target.value)}
              placeholder={demoTodayFocus.intention.placeholder}
              className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none resize-none transition-colors"
              rows={3}
            />
            {!completedItems.intention && intention.length > 10 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-3 right-3"
              >
                <Button 
                  variant="primary" 
                  size="sm"
                  onClick={() => handleComplete('intention')}
                >
                  Set Intention
                </Button>
              </motion.div>
            )}
          </div>

          {!intention && (
            <p className="text-xs text-gray-400 mt-2">
              💡 Example: "{demoTodayFocus.intention.example}"
            </p>
          )}
        </Card>
      </motion.div>

      {/* Daily Leadership Tip */}
      <motion.div variants={itemVariants}>
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              <h2 className="font-semibold text-gray-900">Daily Leadership Tip</h2>
            </div>
            {completedItems.tip ? (
              <Badge variant="success">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Read
              </Badge>
            ) : (
              <Circle className="w-5 h-5 text-gray-300" />
            )}
          </div>

          <div className="bg-amber-50 rounded-xl p-4 mb-4">
            <h3 className="font-semibold text-gray-900 mb-2">{demoTodayFocus.tip.title}</h3>
            <p className="text-gray-700">{demoTodayFocus.tip.content}</p>
            <p className="text-xs text-gray-500 mt-2">From: {demoTodayFocus.tip.source}</p>
          </div>

          {!completedItems.tip && (
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => handleComplete('tip')}
              className="w-full"
            >
              Mark as Read
            </Button>
          )}
        </Card>
      </motion.div>

      {/* Inspirational Quote */}
      <motion.div variants={itemVariants}>
        <Card className="p-6 bg-gradient-to-r from-gray-800 to-gray-900 text-white">
          <Quote className="w-8 h-8 text-gray-500 mb-3" />
          <p className="text-lg font-medium mb-2">"{demoTodayFocus.quote.text}"</p>
          <p className="text-gray-400">— {demoTodayFocus.quote.author}</p>
        </Card>
      </motion.div>

      {/* Progress Summary */}
      <motion.div variants={itemVariants}>
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-full">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-green-900">Morning Practice</p>
                <p className="text-sm text-green-700">
                  {Object.values(completedItems).filter(Boolean).length} of 3 complete
                </p>
              </div>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {Math.round((Object.values(completedItems).filter(Boolean).length / 3) * 100)}%
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default DailyPracticeScreen;

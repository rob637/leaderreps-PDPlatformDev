import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Moon, 
  Star, 
  CheckCircle2,
  Circle,
  Smile,
  Meh,
  Frown,
  Heart,
  TrendingUp,
  MessageSquare,
  BookOpen,
  Sparkles,
  Send
} from 'lucide-react';
import { Card, Button, Badge, ProgressBar } from '../components/ui';
import { demoUser, demoStats, demoTodayFocus } from '../data/demoUser';

const ReflectionScreen = () => {
  const [mood, setMood] = useState(null);
  const [reflection, setReflection] = useState('');
  const [gratitude, setGratitude] = useState(['', '', '']);
  const [wins, setWins] = useState([]);
  const [submitted, setSubmitted] = useState(false);

  const moods = [
    { id: 'great', icon: Smile, label: 'Great', color: '#10B981' },
    { id: 'okay', icon: Meh, label: 'Okay', color: '#F59E0B' },
    { id: 'challenging', icon: Frown, label: 'Challenging', color: '#EF4444' },
  ];

  const dailyWins = [
    'Gave constructive feedback',
    'Delegated a task effectively',
    'Active listening in a meeting',
    'Made a decisive choice',
    'Supported a team member',
    'Stayed calm under pressure',
  ];

  // Sample previous journal entry
  const previousEntry = {
    content: "Today I practiced active listening in my 1:1 with Sarah. Instead of jumping to solutions, I asked more questions. She seemed more engaged and we identified the real issue together.",
    day: demoUser.currentDay - 1
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

  const handleSubmit = () => {
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="min-h-[60vh] flex items-center justify-center"
      >
        <Card className="p-8 text-center max-w-md">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </motion.div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Reflection Complete!</h2>
          <p className="text-gray-600 mb-6">
            You've completed Day {demoUser.currentDay}. Great work maintaining your {demoStats.streakDays}-day streak!
          </p>
          <div className="p-4 bg-primary-50 rounded-xl mb-6">
            <p className="text-primary-700 font-medium">
              🎉 +50 XP earned for today's reflection
            </p>
          </div>
          <Button variant="primary" className="w-full" onClick={() => setSubmitted(false)}>
            Back to Reflection
          </Button>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Evening Header */}
      <motion.div variants={itemVariants}>
        <Card className="p-6 bg-gradient-to-r from-indigo-600 to-purple-700 text-white">
          <div className="flex items-center gap-3 mb-2">
            <Moon className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">Evening Reflection</h1>
              <p className="text-indigo-200">Day {demoUser.currentDay} • Take a moment to reflect</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Mood Check */}
      <motion.div variants={itemVariants}>
        <Card className="p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-500" />
            How are you feeling today?
          </h2>
          <div className="flex gap-4 justify-center">
            {moods.map(moodOption => (
              <button
                key={moodOption.id}
                onClick={() => setMood(moodOption.id)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  mood === moodOption.id 
                    ? 'border-primary-500 bg-primary-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <moodOption.icon 
                  className="w-10 h-10" 
                  style={{ color: moodOption.color }}
                />
                <span className={`text-sm font-medium ${
                  mood === moodOption.id ? 'text-primary-600' : 'text-gray-600'
                }`}>
                  {moodOption.label}
                </span>
              </button>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Daily Wins */}
      <motion.div variants={itemVariants}>
        <Card className="p-6">
          <h2 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            Leadership Wins Today
          </h2>
          <p className="text-sm text-gray-600 mb-4">Select what you accomplished</p>
          <div className="grid grid-cols-2 gap-2">
            {dailyWins.map((win, index) => (
              <button
                key={index}
                onClick={() => {
                  setWins(prev => 
                    prev.includes(win) 
                      ? prev.filter(w => w !== win)
                      : [...prev, win]
                  );
                }}
                className={`p-3 rounded-lg border-2 text-left text-sm transition-all ${
                  wins.includes(win)
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  {wins.includes(win) ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <Circle className="w-4 h-4 text-gray-300" />
                  )}
                  {win}
                </div>
              </button>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Gratitude */}
      <motion.div variants={itemVariants}>
        <Card className="p-6">
          <h2 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500" />
            Three Things I'm Grateful For
          </h2>
          <p className="text-sm text-gray-600 mb-4">Taking time to appreciate builds resilience</p>
          <div className="space-y-3">
            {gratitude.map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <span className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 font-medium text-sm">
                  {index + 1}
                </span>
                <input
                  type="text"
                  value={item}
                  onChange={(e) => {
                    const newGratitude = [...gratitude];
                    newGratitude[index] = e.target.value;
                    setGratitude(newGratitude);
                  }}
                  placeholder={`Grateful for...`}
                  className="flex-1 p-3 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none"
                />
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Journal Entry */}
      <motion.div variants={itemVariants}>
        <Card className="p-6">
          <h2 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-500" />
            Daily Reflection
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            {demoTodayFocus?.reflection?.prompt || 'What leadership moment are you most proud of today?'}
          </p>
          <textarea
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder={demoTodayFocus?.reflection?.placeholder || 'Take a moment to reflect on your day...'}
            className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none resize-none"
            rows={4}
          />
          <p className="text-xs text-gray-400 mt-2">
            💡 {demoTodayFocus?.reflection?.tip || 'Reflection helps solidify learning and builds self-awareness.'}
          </p>
        </Card>
      </motion.div>

      {/* Previous Entry Preview */}
      <motion.div variants={itemVariants}>
        <Card className="p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Yesterday's Entry</span>
            <Badge variant="secondary" size="sm">Day {previousEntry.day}</Badge>
          </div>
          <p className="text-sm text-gray-600 italic line-clamp-2">
            "{previousEntry.content}"
          </p>
        </Card>
      </motion.div>

      {/* Submit Button */}
      <motion.div variants={itemVariants}>
        <Button 
          variant="primary" 
          size="lg"
          className="w-full"
          onClick={handleSubmit}
          disabled={!mood || wins.length === 0}
        >
          <Send className="w-5 h-5 mr-2" />
          Complete Day {demoUser.currentDay}
        </Button>
        {(!mood || wins.length === 0) && (
          <p className="text-center text-sm text-gray-500 mt-2">
            Select your mood and at least one win to continue
          </p>
        )}
      </motion.div>
    </motion.div>
  );
};

export default ReflectionScreen;

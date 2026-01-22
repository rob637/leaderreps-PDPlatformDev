import React from 'react';
import { motion } from 'framer-motion';
import { Play, FileText, Wrench, BookOpen, Clock, Star, ArrowRight } from 'lucide-react';
import { Card, Badge, ProgressBar } from '../components/ui';

const ContentScreen = () => {
  const contentTypes = [
    {
      icon: <Play className="w-6 h-6" />,
      title: 'Leadership Videos',
      count: 45,
      description: 'Expert-led sessions on key leadership topics',
      color: 'teal',
      items: [
        { title: 'The Art of Giving Feedback', duration: '12 min', completed: true },
        { title: 'Building Psychological Safety', duration: '15 min', completed: true },
        { title: 'Leading Through Change', duration: '18 min', completed: false },
      ]
    },
    {
      icon: <FileText className="w-6 h-6" />,
      title: 'Read & Reps',
      count: 32,
      description: 'Short articles with practical takeaways',
      color: 'navy',
      items: [
        { title: 'The 5:1 Magic Ratio Explained', duration: '5 min', completed: true },
        { title: 'Radical Candor in Practice', duration: '7 min', completed: false },
        { title: 'The GROW Coaching Model', duration: '6 min', completed: false },
      ]
    },
    {
      icon: <Wrench className="w-6 h-6" />,
      title: 'Tools & Templates',
      count: 18,
      description: 'Downloadable frameworks and worksheets',
      color: 'orange',
      items: [
        { title: 'CLEAR Feedback Planner', type: 'Template' },
        { title: '1:1 Meeting Agenda', type: 'Template' },
        { title: 'Leadership Identity Worksheet', type: 'Worksheet' },
      ]
    },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <h1 className="text-3xl font-bold text-navy-500 mb-2">Content Library</h1>
        <p className="text-gray-600">Rich resources for continuous learning</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-gradient-to-r from-navy-500 to-teal-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold mb-1">📚 Content Pillar</h2>
            <p className="text-white/80">Videos, articles, tools, and daily micro-learning designed for busy leaders</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">95+</p>
            <p className="text-sm text-white/70">Resources</p>
          </div>
        </div>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6">
        {contentTypes.map((type, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.1 }}>
            <Card className="p-5 h-full">
              <div className={`w-12 h-12 rounded-xl bg-${type.color}-100 flex items-center justify-center text-${type.color}-600 mb-4`}>
                {type.icon}
              </div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-navy-500">{type.title}</h3>
                <Badge variant="default">{type.count}</Badge>
              </div>
              <p className="text-sm text-gray-600 mb-4">{type.description}</p>
              <div className="space-y-2">
                {type.items.map((item, j) => (
                  <div key={j} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                    <span className="text-navy-600 truncate flex-1">{item.title}</span>
                    {item.duration ? (
                      <span className="text-gray-400 flex items-center gap-1 ml-2">
                        <Clock className="w-3 h-3" /> {item.duration}
                      </span>
                    ) : (
                      <Badge variant="info" className="text-xs">{item.type}</Badge>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <Card className="p-5 border-l-4 border-orange-500">
          <h3 className="font-semibold text-navy-500 mb-2">🔄 Constantly Refreshed</h3>
          <p className="text-gray-600">New content is added weekly during Ascent. You'll never run out of material to support your leadership growth.</p>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default ContentScreen;

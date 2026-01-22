import React from 'react';
import { motion } from 'framer-motion';
import { Phone, Mail, Rocket, Users, BookOpen, UserCheck, CheckCircle2, ArrowRight, Star, Heart, Calendar } from 'lucide-react';
import { Card, Button } from '../components/ui';

const ConclusionScreen = () => {
  const contacts = [
    {
      name: 'Ryan Yeoman',
      phone: '614-306-2902',
      role: 'Leadership Development Expert',
      initials: 'RY',
    },
    {
      name: 'Jeff Pierce',
      phone: '202-460-4537',
      role: 'Business Development',
      initials: 'JP',
    },
  ];

  const benefits = [
    'Proven 8-week Foundation program with live cohort sessions',
    'Expert trainers with 20+ years of leadership development experience',
    'Ongoing Ascent phase with unlimited content access',
    'Community of leaders supporting each other',
    'Practical frameworks you can apply immediately (CLEAR, LIS, 5:1 Ratio)',
    'Weekly challenges and monthly themes to sustain growth',
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <h1 className="text-3xl font-bold text-navy-500 mb-2">Transform Your Leadership</h1>
        <p className="text-gray-600">Start your journey with LeaderReps today</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-gradient-to-r from-navy-500 via-teal-600 to-orange-500 rounded-xl p-8 text-white text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: "spring" }}>
          <Star className="w-16 h-16 mx-auto mb-4 text-yellow-400" />
        </motion.div>
        <h2 className="text-2xl font-bold mb-2">Ready to Become the Leader Your Team Deserves?</h2>
        <p className="text-white/90 max-w-2xl mx-auto">Join thousands of leaders who have transformed their leadership through LeaderReps. Our proven approach combines community, content, and coaching for lasting results.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="p-6">
          <h3 className="font-semibold text-navy-500 mb-4 text-center">What You Get with LeaderReps</h3>
          <div className="grid md:grid-cols-2 gap-3">
            {benefits.map((benefit, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">{benefit}</span>
              </motion.div>
            ))}
          </div>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card className="p-6 bg-navy-50">
          <div className="flex items-center gap-3 mb-4">
            <Heart className="w-6 h-6 text-orange-500" />
            <h3 className="font-semibold text-navy-500">The Three Pillars of Growth</h3>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-white rounded-lg">
              <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-teal-600" />
              </div>
              <h4 className="font-medium text-navy-500 mb-1">Community</h4>
              <p className="text-xs text-gray-600">Learn alongside peers who understand your challenges</p>
            </div>
            <div className="text-center p-4 bg-white rounded-lg">
              <div className="w-12 h-12 bg-navy-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <BookOpen className="w-6 h-6 text-navy-600" />
              </div>
              <h4 className="font-medium text-navy-500 mb-1">Content</h4>
              <p className="text-xs text-gray-600">95+ resources constantly updated for ongoing learning</p>
            </div>
            <div className="text-center p-4 bg-white rounded-lg">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <UserCheck className="w-6 h-6 text-orange-600" />
              </div>
              <h4 className="font-medium text-navy-500 mb-1">Coaching</h4>
              <p className="text-xs text-gray-600">Expert trainers guiding your personal development</p>
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
        <div className="text-center mb-6">
          <Phone className="w-10 h-10 mx-auto mb-3" />
          <h3 className="text-xl font-bold mb-2">Let's Talk About Your Leadership Journey</h3>
          <p className="text-orange-100">Connect with our team to learn how LeaderReps can transform your organization</p>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {contacts.map((contact, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + i * 0.1 }}
              className="bg-white rounded-xl p-5 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-navy-500 to-navy-600 rounded-full flex items-center justify-center mx-auto mb-3 text-white text-xl font-bold">
                {contact.initials}
              </div>
              <h4 className="font-semibold text-navy-500 text-lg">{contact.name}</h4>
              <p className="text-sm text-gray-500 mb-3">{contact.role}</p>
              <a href={`tel:${contact.phone.replace(/-/g, '')}`}
                className="inline-flex items-center justify-center gap-2 bg-navy-500 text-white px-5 py-3 rounded-lg font-medium hover:bg-navy-600 transition-colors w-full">
                <Phone className="w-4 h-4" />
                {contact.phone}
              </a>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
        className="text-center bg-gray-50 rounded-xl p-6">
        <Rocket className="w-8 h-8 text-teal-500 mx-auto mb-3" />
        <h3 className="font-semibold text-navy-500 mb-2">Take the First Step</h3>
        <p className="text-gray-600 max-w-xl mx-auto mb-4">Your leadership transformation starts with a single conversation. Reach out today and discover how LeaderReps can help you and your team reach new heights.</p>
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
          <Calendar className="w-4 h-4" />
          <span>Next Foundation cohorts starting soon</span>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
        className="text-center py-4">
        <p className="text-sm text-gray-400">© 2024 LeaderReps. Building better leaders, one rep at a time.</p>
      </motion.div>
    </motion.div>
  );
};

export default ConclusionScreen;

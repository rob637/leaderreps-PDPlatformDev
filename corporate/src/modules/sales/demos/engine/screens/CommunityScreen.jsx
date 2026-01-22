import React from 'react';
import { motion } from 'framer-motion';
import { Users, Calendar, MessageCircle, Video, Heart, Award } from 'lucide-react';
import { Card, Badge, Button } from '../components/ui';
import { cohortMembers, upcomingSessions, demoUser } from '../data/demoUser';

const CommunityScreen = () => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <h1 className="text-3xl font-bold text-navy-500 mb-2">Community</h1>
        <p className="text-gray-600">Learn together, grow together</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-1">🤝 Community Pillar</h2>
            <p className="text-teal-100">Leadership development is not a solo journey. Connect, share, and grow with peers who understand your challenges.</p>
          </div>
        </div>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="p-5">
            <h3 className="font-semibold text-navy-500 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal-600" />
              Upcoming Sessions
            </h3>
            <div className="space-y-3">
              {upcomingSessions.map((session) => (
                <div key={session.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant={session.type.includes('Cohort') ? 'success' : 'info'}>{session.type}</Badge>
                    {session.registered && <Badge variant="success">Registered ✓</Badge>}
                  </div>
                  <h4 className="font-medium text-navy-500 mb-1">{session.title}</h4>
                  <p className="text-sm text-gray-500">{session.date} • {session.time} • {session.duration}</p>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="p-5">
            <h3 className="font-semibold text-navy-500 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-teal-600" />
              Your {demoUser.cohortName}
            </h3>
            <p className="text-sm text-gray-600 mb-4">12 leaders growing together through Foundation and beyond.</p>
            <div className="flex flex-wrap gap-3">
              {cohortMembers.map((member, i) => (
                <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <span className="text-xl">{member.avatar}</span>
                  <div>
                    <p className="text-sm font-medium text-navy-600">{member.name.split(' ')[0]}</p>
                    <p className="text-xs text-gray-500">{member.company}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card className="p-5">
          <h3 className="font-semibold text-navy-500 mb-4">Community Features</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { icon: <Video className="w-5 h-5" />, title: 'Live Sessions', desc: 'Weekly cohort meetings and monthly community calls' },
              { icon: <MessageCircle className="w-5 h-5" />, title: 'Discussion Forums', desc: 'Share wins, ask questions, get peer support' },
              { icon: <Award className="w-5 h-5" />, title: 'Leaders Circle', desc: 'Open forums to discuss real challenges with peers' },
            ].map((feature, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="p-2 bg-teal-100 rounded-lg text-teal-600">{feature.icon}</div>
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
        className="bg-navy-50 rounded-xl p-6 text-center">
        <Heart className="w-8 h-8 text-orange-500 mx-auto mb-3" />
        <h3 className="font-semibold text-navy-500 mb-2">Relationships That Last</h3>
        <p className="text-gray-600 max-w-2xl mx-auto">The connections you build during Foundation extend into Ascent and beyond. Many cohort members become lifelong professional contacts and friends.</p>
      </motion.div>
    </motion.div>
  );
};

export default CommunityScreen;

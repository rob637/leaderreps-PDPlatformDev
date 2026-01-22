import React from 'react';
import { motion } from 'framer-motion';
import { Layers, Mountain, ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import { Card, Badge, ProgressBar } from '../components/ui';

const JourneyOverviewScreen = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-3xl font-bold text-navy-500 mb-2">
          Your Leadership Journey
        </h1>
        <p className="text-gray-600">
          A structured path from Foundation to continuous growth
        </p>
      </motion.div>

      {/* Journey Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative"
      >
        {/* Connection Line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-teal-500 via-navy-500 to-orange-500 transform -translate-x-1/2 hidden md:block" />
        
        <div className="space-y-8">
          {/* Foundation Phase */}
          <Card className="p-6 md:ml-auto md:w-[calc(50%-2rem)] relative">
            <div className="absolute left-0 top-1/2 transform -translate-x-full -translate-y-1/2 hidden md:flex items-center">
              <div className="w-8 h-1 bg-teal-500" />
              <div className="w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center text-white">
                <Layers className="w-3 h-3" />
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-teal-100 rounded-xl md:hidden">
                <Layers className="w-6 h-6 text-teal-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="success">Phase 1</Badge>
                  <span className="text-sm text-gray-500">8 Weeks</span>
                </div>
                <h2 className="text-xl font-semibold text-navy-500 mb-2">Foundation</h2>
                <p className="text-gray-600 mb-4">
                  Build your leadership foundation through live weekly sessions with your cohort. 
                  Master essential frameworks and develop your Leadership Identity Statement.
                </p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-teal-500" />
                    <span>4 Core Sessions</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-teal-500" />
                    <span>1:1 Coaching</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-teal-500" />
                    <span>Companion Workbook</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-teal-500" />
                    <span>Arena Access</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Transition Arrow */}
          <div className="flex justify-center">
            <div className="p-2 bg-navy-100 rounded-full">
              <ArrowRight className="w-5 h-5 text-navy-500 rotate-90" />
            </div>
          </div>

          {/* Ascent Phase */}
          <Card className="p-6 md:mr-auto md:w-[calc(50%-2rem)] relative">
            <div className="absolute right-0 top-1/2 transform translate-x-full -translate-y-1/2 hidden md:flex items-center">
              <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white">
                <Mountain className="w-3 h-3" />
              </div>
              <div className="w-8 h-1 bg-orange-500" />
            </div>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-orange-100 rounded-xl md:hidden">
                <Mountain className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="warning">Phase 2</Badge>
                  <span className="text-sm text-gray-500">Ongoing</span>
                </div>
                <h2 className="text-xl font-semibold text-navy-500 mb-2">Ascent</h2>
                <p className="text-gray-600 mb-4">
                  Continue your growth with full Arena access. Engage with weekly challenges, 
                  fresh content, community sessions, and continuous skill development.
                </p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-orange-500" />
                    <span>Weekly Challenges</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-orange-500" />
                    <span>New Content Daily</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-orange-500" />
                    <span>Community Sessions</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-orange-500" />
                    <span>Advanced Training</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </motion.div>

      {/* Key Outcomes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gray-50 rounded-xl p-6"
      >
        <h3 className="text-lg font-semibold text-navy-500 mb-4 text-center">
          What You'll Achieve
        </h3>
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { label: 'Give Clear Feedback', desc: 'Using the CLEAR Framework' },
            { label: 'Define Your Identity', desc: 'Leadership Identity Statement' },
            { label: 'Build Trust', desc: 'Vulnerability-based relationships' },
            { label: 'Coach Your Team', desc: 'Effective 1:1s and development' },
          ].map((outcome, i) => (
            <div key={i} className="text-center p-4 bg-white rounded-lg">
              <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center mx-auto mb-2 font-bold">
                {i + 1}
              </div>
              <p className="font-medium text-navy-500">{outcome.label}</p>
              <p className="text-xs text-gray-500 mt-1">{outcome.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default JourneyOverviewScreen;

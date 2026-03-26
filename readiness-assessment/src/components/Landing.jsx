import { motion } from 'framer-motion';
import { Sparkles, Clock, Target, Award, ChevronRight, Users, TrendingUp, CheckCircle2, AlertTriangle, Compass } from 'lucide-react';

const Landing = ({ onStart }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col"
    >
      {/* Header */}
      <header className="p-4 md:p-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src="/logo-white.png" 
              alt="LeaderReps" 
              className="h-8 md:h-10"
            />
          </div>
          <a 
            href="https://www.leaderreps.com" 
            className="text-teal hover:text-teal/80 transition text-sm"
          >
            Learn about our programs →
          </a>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-teal mb-8"
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">AI-Powered Assessment</span>
          </motion.div>

          {/* Main headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight"
          >
            Are You{' '}
            <span className="gradient-text-teal">Ready to Lead?</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-lg md:text-xl text-white/70 mb-10 max-w-2xl mx-auto"
          >
            Discover your leadership readiness in 5 minutes. Get personalized AI insights on your strengths, growth areas, and a clear path to becoming the leader you're meant to be.
          </motion.p>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <button
              onClick={onStart}
              className="group relative inline-flex items-center gap-3 px-8 py-4 bg-teal hover:bg-teal/90 text-white font-bold text-lg rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-teal/20 pulse-ring-teal"
            >
              <span>Discover My Readiness</span>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap items-center justify-center gap-6 md:gap-8 mt-10 text-white/50 text-sm"
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>5 minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              <span>12 questions</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4" />
              <span>Free forever</span>
            </div>
          </motion.div>
        </div>
      </main>

      {/* The Problem Section */}
      <section className="px-4 py-12 md:py-16 bg-white/5">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Most Leaders Don't Know Their Gaps
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              Leadership readiness isn't about titles or years of experience—it's about having the right skills when you need them most.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <AlertTriangle className="w-6 h-6" />,
                stat: '67%',
                label: 'of new leaders feel unprepared for the role',
                subtext: 'DDI Leadership Study',
              },
              {
                icon: <Users className="w-6 h-6" />,
                stat: '60%',
                label: 'of managers receive no leadership training',
                subtext: 'CareerBuilder Research',
              },
              {
                icon: <TrendingUp className="w-6 h-6" />,
                stat: '4x',
                label: 'more effective when leaders know their gaps',
                subtext: 'McKinsey & Company',
              },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass rounded-2xl p-6 text-center"
              >
                <div className="w-12 h-12 rounded-xl bg-teal/20 flex items-center justify-center mx-auto mb-4 text-teal">
                  {item.icon}
                </div>
                <div className="text-4xl font-bold text-teal mb-2">{item.stat}</div>
                <div className="text-white/80 text-sm mb-2">{item.label}</div>
                <div className="text-white/40 text-xs">{item.subtext}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* What You'll Discover */}
      <section className="px-4 py-12 md:py-16">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              What You'll Discover
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                icon: <Compass className="w-6 h-6" />,
                title: 'Your Leadership Archetype',
                description: "Understand your natural leadership style and how to leverage it effectively.",
              },
              {
                icon: <TrendingUp className="w-6 h-6" />,
                title: 'Your Top 2 Strengths',
                description: "Know exactly what makes you effective so you can double down on it.",
              },
              {
                icon: <Target className="w-6 h-6" />,
                title: 'Your Growth Areas',
                description: "See clearly where focused development will have the biggest impact.",
              },
              {
                icon: <CheckCircle2 className="w-6 h-6" />,
                title: 'Your Readiness Score',
                description: "Get an honest assessment of where you stand across 5 dimensions.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass rounded-2xl p-6 flex gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-teal/20 flex items-center justify-center shrink-0 text-teal">
                  {item.icon}
                </div>
                <div>
                  <h3 className="text-white font-bold mb-1">{item.title}</h3>
                  <p className="text-white/60 text-sm">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 py-12 md:py-16 bg-gradient-to-t from-teal/10 to-transparent">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">
              Ready to see where you stand?
            </h2>
            <button
              onClick={onStart}
              className="group inline-flex items-center gap-3 px-8 py-4 bg-teal hover:bg-teal/90 text-white font-bold text-lg rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-teal/20"
            >
              <span>Start the Assessment</span>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="p-6 text-center text-white/40 text-sm">
        © {new Date().getFullYear()} LeaderReps. All rights reserved.
      </footer>
    </motion.div>
  );
};

export default Landing;
